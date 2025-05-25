"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { AdminLoading } from "@/components/admin/loading"
import { Trash2, CheckCircle, Archive, Reply } from "lucide-react"
import { EmailResponseModal } from "@/components/admin/email-response-modal"

interface Feedback {
  id: string
  name: string
  email: string
  message: string
  status: 'pending' | 'reviewed' | 'archived'
  created_at: string
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedback(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load feedback",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'reviewed' | 'archived') => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      
      fetchFeedback()
      toast({
        title: "Status updated",
        description: "Feedback status has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      })
    }
  }

  const deleteFeedback = async (id: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setFeedback(feedback.filter(item => item.id !== id))
      toast({
        title: "Feedback deleted",
        description: "The feedback has been permanently deleted.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete feedback",
      })
    }
  }

  if (loading) return <AdminLoading />

  const groupedFeedback = {
    pending: feedback.filter(item => !item.status || item.status === 'pending'),
    reviewed: feedback.filter(item => item.status === 'reviewed'),
    archived: feedback.filter(item => item.status === 'archived')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Feedback Management</h1>
      
      {/* Pending Feedback */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pending Feedback</h2>
        <div className="grid gap-4">
          {groupedFeedback.pending.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onUpdateStatus={updateStatus}
              onDelete={deleteFeedback}
            />
          ))}
          {groupedFeedback.pending.length === 0 && (
            <p className="text-muted-foreground">No pending feedback</p>
          )}
        </div>
      </div>

      {/* Reviewed Feedback */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reviewed Feedback</h2>
        <div className="grid gap-4">
          {groupedFeedback.reviewed.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onUpdateStatus={updateStatus}
              onDelete={deleteFeedback}
            />
          ))}
          {groupedFeedback.reviewed.length === 0 && (
            <p className="text-muted-foreground">No reviewed feedback</p>
          )}
        </div>
      </div>

      {/* Archived Feedback */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Archived Feedback</h2>
        <div className="grid gap-4">
          {groupedFeedback.archived.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onUpdateStatus={updateStatus}
              onDelete={deleteFeedback}
            />
          ))}
          {groupedFeedback.archived.length === 0 && (
            <p className="text-muted-foreground">No archived feedback</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface FeedbackCardProps {
  item: Feedback
  onUpdateStatus: (id: string, status: 'reviewed' | 'archived') => void
  onDelete: (id: string) => void
}

function FeedbackCard({ item, onUpdateStatus, onDelete }: FeedbackCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false)
  
  const statusColors = {
    pending: 'bg-yellow-500',
    reviewed: 'bg-green-500',
    archived: 'bg-gray-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span>{item.name}</span>
          <Badge className={statusColors[item.status || 'pending']}>
            {item.status || 'pending'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{item.email}</p>
        <p className="mb-4 whitespace-pre-wrap">{item.message}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Received: {new Date(item.created_at).toLocaleDateString()}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => setShowResponseModal(true)}
            >
              <Reply className="h-4 w-4" />
              <span>Respond</span>
            </Button>
            {(!item.status || item.status === 'pending') && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => onUpdateStatus(item.id, 'reviewed')}
              >
                <CheckCircle className="h-4 w-4" />
                <span>Mark as Reviewed</span>
              </Button>
            )}
            {item.status !== 'archived' && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => onUpdateStatus(item.id, 'archived')}
              >
                <Archive className="h-4 w-4" />
                <span>Archive</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="flex items-center gap-1"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
      <EmailResponseModal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        feedback={item}
      />
    </Card>
  )
}