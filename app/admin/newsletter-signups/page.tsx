"use client"
import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface NewsletterSignup {
  id: string
  first_name: string
  last_name: string
  email: string
  agreed: boolean
  created_at: string
}

function convertToCSV(data: NewsletterSignup[]): string {
  if (!data.length) return ""
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h as keyof NewsletterSignup] ?? "")).join(","))
  return [headers.join(","), ...rows].join("\n")
}

export default function NewsletterSignupsPage() {
  const [signups, setSignups] = useState<NewsletterSignup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabaseBrowserClient()
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id ?? null)
        // You can now use user?.id in your request or for logging
        const { data, error } = await supabase
          .from("newsletter_signups")
          .select("*")
        if (error) throw error
        setSignups(data || [])
      } catch (err: any) {
        setError(err.message || "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDownload = () => {
    const csv = convertToCSV(signups)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "newsletter_signups.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Newsletter Signups</h1>
      <Card className="max-w-3xl mx-auto p-6">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <Button onClick={handleDownload} className="mb-4">Download CSV</Button>
            <div className="overflow-x-auto">
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">First Name</th>
                    <th className="border px-2 py-1">Last Name</th>
                    <th className="border px-2 py-1">Email</th>
                    <th className="border px-2 py-1">Agreed</th>
                    <th className="border px-2 py-1">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map(s => (
                    <tr key={s.id}>
                      <td className="border px-2 py-1">{s.first_name}</td>
                      <td className="border px-2 py-1">{s.last_name}</td>
                      <td className="border px-2 py-1">{s.email}</td>
                      <td className="border px-2 py-1">{s.agreed ? "Yes" : "No"}</td>
                      <td className="border px-2 py-1">{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
