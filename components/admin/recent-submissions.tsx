"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Check, X, ExternalLink } from "lucide-react"
import { format } from "date-fns"

interface Submission {
  id: string
  submitter_name: string
  submitter_email: string
  title: string
  description: string
  submission_type: "event" | "opportunity"
  created_at: string
  status: "pending" | "approved" | "rejected"
}

export default function RecentSubmissions({ submissions }: { submissions: Submission[] }) {
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessing((prev) => ({ ...prev, [id]: true }))

    try {
      // Update submission status
      await supabase
        .from("submissions")
        .update({ status: action === "approve" ? "approved" : "rejected" })
        .eq("id", id)

      // If approved, create the corresponding event or opportunity
      if (action === "approve") {
        const { data: submission } = await supabase.from("submissions").select("*").eq("id", id).single()

        if (submission) {
          if (submission.submission_type === "event") {
            await supabase.from("events").insert({
              title: submission.title,
              description: submission.description,
              date: submission.date,
              time: submission.time,
              location: submission.location,
              location_type: submission.location_type,
              is_free: submission.is_free,
              link: submission.link,
              flyer_url: submission.flyer_url,
            })
          } else {
            await supabase.from("opportunities").insert({
              title: submission.title,
              description: submission.description,
              deadline: submission.date_or_deadline,
              eligibility: submission.eligibility,
              category: submission.category,
              is_free: submission.is_free,
              link: submission.link,
              flyer_url: submission.flyer_url,
            })
          }
        }
      }

      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error processing submission:", error)
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
    }
  }

  const viewDetails = (id: string) => {
    router.push(`/admin/submissions/${id}`)
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{submission.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                By {submission.submitter_name} ({submission.submitter_email})
              </p>
              <div className="flex items-center mt-2">
                <Badge variant={submission.submission_type === "event" ? "secondary" : "default"}>
                  {submission.submission_type === "event" ? "Event" : "Opportunity"}
                </Badge>
                <span className="text-xs text-gray-500 ml-2">
                  {format(new Date(submission.created_at), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={() => viewDetails(submission.id)}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                onClick={() => handleAction(submission.id, "approve")}
                disabled={processing[submission.id]}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                onClick={() => handleAction(submission.id, "reject")}
                disabled={processing[submission.id]}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
