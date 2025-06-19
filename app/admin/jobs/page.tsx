"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { AdminLoading } from "@/components/admin/loading"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { Plus, Edit, Trash, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Job {
  id: string
  title: string
  description: string
  company: string
  location: string
  job_type: string
  salary_range?: string
  deadline: string
  requirements: string
  link: string
  featured: boolean
  created_at: string
}

const jobTypes = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'remote',
  'graduate-trainee'
] as const;

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({})
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      setJobs(data || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch jobs",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteJob = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;
    setProcessing((prev) => ({ ...prev, [id]: true }))
    try {
      const { error } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id)
      if (error) throw error
      setJobs(jobs.filter((j) => j.id !== id))
      toast({
        title: "Job deleted",
        description: "The job has been removed.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete job",
      })
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }))
    }
  }

  const toggleFeature = async (id: string) => {
    try {
      const job = jobs.find(j => j.id === id)
      if (!job) return

      const { error } = await supabase
        .from('jobs')
        .update({ featured: !job.featured })
        .eq('id', id)

      if (error) throw error

      setJobs(jobs =>
        jobs.map(j => j.id === id ? { ...j, featured: !j.featured } : j)
      )

      toast({
        title: "Featured status updated",
        description: "The job's featured status has been updated.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update featured status",
      })
    }
  }

  if (loading) return <AdminLoading />

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jobs Management</h1>
        <Button onClick={() => router.push("/admin/jobs/new")} className="bg-brand-orange hover:bg-brand-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Job
        </Button>
      </div>
      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs posted yet.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>{job.company} &mdash; {job.job_type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Company: {job.company}</p>
                  <p>Location: {job.location}</p>
                  <p>Type: {job.job_type}</p>
                  {job.salary_range && <p>Salary: {job.salary_range}</p>}
                  <p>Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                  <p>Requirements: {job.requirements}</p>
                  <p>Description: {job.description}</p>
                  <p>Apply: <a href={job.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{job.link}</a></p>
                  {job.featured && <span className="inline-block px-2 py-1 bg-amber-400 text-xs rounded">Featured</span>}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2">
                <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex items-center gap-1",
                        job.featured ? "bg-amber-100 hover:bg-amber-200" : "hover:bg-amber-100"
                      )}
                      onClick={() => toggleFeature(job.id)}
                    >
                      <Star className={cn("h-4 w-4", job.featured ? "fill-amber-500" : "")} />
                      <span>{job.featured ? "Unfeature" : "Feature"}</span>
                    </Button>
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/jobs/${job.id}`)}>
                  <Edit className="h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteJob(job.id)} disabled={processing[job.id]}>
                  <Trash className="h-4 w-4" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
