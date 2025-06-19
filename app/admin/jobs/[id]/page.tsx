"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminLoading } from "@/components/admin/loading"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface JobFormData {
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
}

const jobTypes = [
  'full-time',
  'part-time',
  'contract',
  'internship',
  'remote',
  'graduate-trainee'
] as const

export default function EditJobPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<JobFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", params.id)
          .single()
        if (error) throw error
        if (!data) throw new Error("Job not found")
        setFormData(data)
      } catch (error: any) {
        setError(error.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch job",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [params.id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => prev ? ({ ...prev, [name]: (e.target as HTMLInputElement).checked }) : null)
    } else {
      setFormData((prev) => prev ? ({ ...prev, [name]: value }) : null)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => prev ? ({ ...prev, job_type: e.target.value }) : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from("jobs")
        .update({
          title: formData.title,
          description: formData.description,
          company: formData.company,
          location: formData.location,
          job_type: formData.job_type,
          salary_range: formData.salary_range,
          deadline: formData.deadline,
          requirements: formData.requirements,
          link: formData.link,
          featured: formData.featured,
        })
        .eq("id", params.id)
      if (updateError) throw updateError
      toast({
        title: "Success",
        description: "Job updated successfully",
      })
      router.push("/admin/jobs")
    } catch (error: any) {
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update job",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <AdminLoading />
  if (!formData) return <Alert><AlertDescription>Job not found</AlertDescription></Alert>

  return (
    <div className="p-6">
      <Card className="max-w-3xl mx-auto p-6">
        <CardHeader>
          <CardTitle>Edit Job</CardTitle>
          <CardDescription>Update the job details below.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium">Title</label>
              <Input name="title" value={formData.title} onChange={handleChange} required />
            </div>
            <div>
              <label className="block font-medium">Company</label>
              <Input name="company" value={formData.company} onChange={handleChange} required />
            </div>
            <div>
              <label className="block font-medium">Location</label>
              <Input name="location" value={formData.location} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-medium">Job Type</label>
              <select name="job_type" value={formData.job_type} onChange={handleSelectChange} className="w-full border rounded p-2">
                {jobTypes.map((type) => (
                  <option key={type} value={type}>{type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium">Salary Range</label>
              <Input name="salary_range" value={formData.salary_range} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-medium">Deadline</label>
              <Input name="deadline" type="date" value={formData.deadline} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-medium">Requirements</label>
              <Textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={2} />
            </div>
            <div>
              <label className="block font-medium">Link</label>
              <Input name="link" value={formData.link} onChange={handleChange} />
            </div>
            <div>
              <label className="block font-medium">Featured</label>
              <input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} />
              <span className="ml-2">Feature this job</span>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/jobs")}>Cancel</Button>
              <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90">{loading ? "Updating Job..." : "Update Job"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
