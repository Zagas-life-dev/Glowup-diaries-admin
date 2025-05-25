"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Edit, Trash, Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AdminLoading } from "@/components/admin/loading"
import { isBefore, parseISO } from 'date-fns'
import { cn } from "@/lib/utils"

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  location_type: string;
  featured: boolean;
  created_at: string;
  is_free: boolean;
}

interface Submission {
  id: string
  submitter_name: string
  submitter_email: string
  title: string
  description: string
  submission_type: "event" | "opportunity"
  date: string
  time: string
  location: string
  location_type: string
  is_free: boolean
  link: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export default function EventsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [publishedEvents, setPublishedEvents] = useState<Event[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([])
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchEvents()
    fetchPendingSubmissions()
    // Run cleanup when the page loads
    cleanupPastEvents()
    
    // Set up an interval to check for past events every hour
    const cleanup = setInterval(cleanupPastEvents, 1000 * 60 * 60)
    
    return () => clearInterval(cleanup)
  }, [])

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setPublishedEvents(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch events",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('submission_type', 'event')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingSubmissions(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch pending submissions",
      })
    }
  }

  const cleanupPastEvents = async () => {
    try {
      const now = new Date()
      const { data: expiredEvents, error: fetchError } = await supabase
        .from('events')
        .select('id, date')
        .order('date', { ascending: true })

      if (fetchError) throw fetchError

      const eventsToDelete = expiredEvents?.filter(event => {
        const eventDate = parseISO(`${event.date}`)
        return isBefore(eventDate, now)
      }) || []

      if (eventsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .in('id', eventsToDelete.map(e => e.id))

        if (deleteError) throw deleteError

        // Update the local state to remove deleted events
        setPublishedEvents(current => 
          current.filter(event => !eventsToDelete.some(e => e.id === event.id))
        )

        toast({
          title: "Cleanup completed",
          description: `${eventsToDelete.length} past events have been removed.`,
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cleanup past events",
      })
    }
  }

  const toggleFeature = async (id: string) => {
    try {
      const event = publishedEvents.find(e => e.id === id)
      if (!event) return

      const { error } = await supabase
        .from('events')
        .update({ featured: !event.featured })
        .eq('id', id)

      if (error) throw error

      setPublishedEvents(events =>
        events.map(e => e.id === id ? { ...e, featured: !e.featured } : e)
      )

      toast({
        title: "Featured status updated",
        description: "The event's featured status has been updated.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update featured status",
      })
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPublishedEvents(events => events.filter(e => e.id !== id))
      toast({
        title: "Event deleted",
        description: "The event has been removed from the site.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete event",
      })
    }
  }

  const approveSubmission = async (id: string) => {
    setProcessing((prev) => ({ ...prev, [id]: true }))
    
    try {
      // Get the submission details
      const { data: submission, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      if (!submission) throw new Error('Submission not found')

      // Insert into events table
      const { error: insertError } = await supabase
        .from('events')
        .insert({
          title: submission.title,
          description: submission.description,
          date: submission.date,
          time: submission.time,
          location: submission.location,
          location_type: submission.location_type,
          is_free: submission.is_free,
          link: submission.link
        })

      if (insertError) throw insertError

      // Delete from submissions table
      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update local state
      setPendingSubmissions(current => current.filter(s => s.id !== id))
      fetchEvents() // Refresh published events

      toast({
        title: "Success",
        description: "Event has been approved and published.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve submission",
      })
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
    }
  }

  const rejectSubmission = async (id: string) => {
    setProcessing((prev) => ({ ...prev, [id]: true }))
    
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error

      setPendingSubmissions(current => current.filter(s => s.id !== id))
      toast({
        title: "Submission rejected",
        description: "The submission has been rejected.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject submission",
      })
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
    }
  }

  if (loading) {
    return <AdminLoading />
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events Management</h1>
        <Button onClick={() => router.push("/admin/events/new")} className="bg-brand-orange hover:bg-brand-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Event
        </Button>
      </div>
      
      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Events</TabsTrigger>
          <TabsTrigger value="published">Published Events</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <p className="text-gray-500">No pending events to review.</p>
          ) : (
            <div className="grid gap-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <CardTitle>{submission.title}</CardTitle>
                    <CardDescription>{submission.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Submitted by: {submission.submitter_name} ({submission.submitter_email})</p>
                      <p>Date: {submission.date}</p>
                      <p>Time: {submission.time}</p>
                      <p>Location: {submission.location} ({submission.location_type})</p>
                      <p>Type: {submission.is_free ? "Free" : "Paid"}</p>
                      <p>Link: {submission.link}</p>
                      <p>Submitted on: {new Date(submission.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => rejectSubmission(submission.id)}
                      disabled={processing[submission.id]}
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveSubmission(submission.id)}
                      disabled={processing[submission.id]}
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedEvents.length === 0 ? (
            <p className="text-gray-500">No published events.</p>
          ) : (
            <div className="grid gap-4">
              {publishedEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {event.featured && <Badge className="bg-amber-500">Featured</Badge>}
                        {event.is_free && <Badge className="bg-green-500">Free</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Date: {event.date } </p>
                      <p>Time: {event.time}</p>
                      <p>Location: {event.location} ({event.location_type})</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex items-center gap-1",
                        event.featured ? "bg-amber-100 hover:bg-amber-200" : "hover:bg-amber-100"
                      )}
                      onClick={() => toggleFeature(event.id)}
                    >
                      <Star className={cn("h-4 w-4", event.featured ? "fill-amber-500" : "")} />
                      <span>{event.featured ? "Unfeature" : "Feature"}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
