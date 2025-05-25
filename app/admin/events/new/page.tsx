"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AdminLoading } from "@/components/admin/loading"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { ArrowLeft, AlertCircle, CalendarIcon } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { parse } from "date-fns"

interface EventFormData {
  id: string
  title: string
  description: string
  link: string
  date: string
  time: string
  location: string
  location_type: string
  is_free: boolean
  featured: boolean
}

export default function NewEventPage() {
  const [formData, setFormData] = useState<EventFormData>({
    id: uuidv4(),
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    location_type: "online",
    is_free: true,
    link: "",
    featured: false,
  })
  
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setFormData(prev => ({
        ...prev,
        date: format(date, "yyyy-MM-dd")
      }))
    }
  }

  // const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { value } = e.target
  //   setFormData(prev => ({
  //     ...prev,
  //     time: value
  //   }))
  // }

  const handleRadioChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.date || !formData.time) {
        throw new Error("Please select both date and time")
      }

      // Create a date object in the local timezone
      const dateTimeString = `${formData.date}`;
      const localDate = parse(dateTimeString, "yyyy-MM-dd", new Date());
      
      if (isNaN(localDate.getTime())) {
        throw new Error("Invalid date or time format")
      }

      // Convert to UTC for storage while preserving the intended local time
      const datetime = localDate.toISOString();

      const { error: insertError } = await supabase
        .from("events")
        .insert({
          id: formData.id,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          location_type: formData.location_type,
          is_free: formData.is_free,
          link: formData.link,
          featured: formData.featured
        })

      if (insertError) {
        throw insertError
      }

      router.push("/admin/events")
      toast({
        title: "Success",
        description: "Event created successfully",
      })
    } catch (error: any) {
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create event",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AdminLoading />
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Add New Event</h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Fill in the details for the new event</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the event"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="Enter event link"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="Enter time (09:00 AM)"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., New York, USA or Zoom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Location Type</Label>
                <RadioGroup
                  value={formData.location_type}
                  onValueChange={(value) => handleRadioChange("location_type", value)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online">Online</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physical" id="physical" />
                    <Label htmlFor="physical">Physical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid">Hybrid</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Is it Free or Paid?</Label>
                <RadioGroup
                  value={formData.is_free ? "free" : "paid"}
                  onValueChange={(value) => handleRadioChange("is_free", value === "free")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="event-free" />
                    <Label htmlFor="event-free">Free</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="event-paid" />
                    <Label htmlFor="event-paid">Paid</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleRadioChange("featured", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="featured">Feature this event on homepage</Label>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full bg-brand-orange hover:bg-brand-orange/90">
                {loading ? "Creating Event..." : "Create Event"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-gray-500">Events will be visible to all users after creation</p>
        </CardFooter>
      </Card>
    </div>
  )
}
