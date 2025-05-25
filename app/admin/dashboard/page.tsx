"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, FileText, Clock } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    events: 0,
    opportunities: 0,
    resources: 0,
    pendingSubmissions: 0,
  })

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: eventsCount },
          { count: opportunitiesCount },
          { count: resourcesCount },
          { data: pendingSubmissions },
        ] = await Promise.all([
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("opportunities").select("*", { count: "exact", head: true }),
          supabase.from("resources").select("*", { count: "exact", head: true }),
          supabase.from("submissions").select("*").eq("status", "pending"),
        ])

        setStats({
          events: eventsCount || 0,
          opportunities: opportunitiesCount || 0,
          resources: resourcesCount || 0,
          pendingSubmissions: pendingSubmissions?.length || 0,
        })
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const statsCards = [
    {
      title: "Total Events",
      value: stats.events,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Opportunities",
      value: stats.opportunities,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Resources",
      value: stats.resources,
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pending Submissions",
      value: stats.pendingSubmissions,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-100",
    },
  ]

  if (loading) return <p>Loading...</p>
  if (error) return <Alert><AlertDescription>{error}</AlertDescription></Alert>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Quick links to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>• Review pending events and opportunities submissions</li>
              <li>• Add new educational resources</li>
              <li>• Manage featured content</li>
              <li>• Update your admin profile</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <p className="text-sm">New event submission: "Youth Leadership Conference"</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <p className="text-sm">New opportunity submission: "Summer Internship Program"</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <p className="text-sm">Resource updated: "Resume Building Masterclass"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
