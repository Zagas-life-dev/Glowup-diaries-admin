"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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

export default function NewJobPage() {
  const [formData, setFormData] = useState<JobFormData>({
    id: uuidv4(),
    title: "",
    description: "",
    company: "",
    location: "",
    job_type: jobTypes[0],
    salary_range: "",
    deadline: "",
    requirements: "",
    link: "",
    featured: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, tags: e.target.value.split(",").map(t => t.trim()) }))
  }

  const handleJobTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, job_type: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: insertError } = await supabase
        .from("jobs")
        .insert({ ...formData })
      if (insertError) throw insertError
      toast({
        title: "Job created",
        description: "The job has been successfully created.",
      })
      router.push("/admin/jobs")
    } catch (error: any) {
      setError(error.message || "Failed to create job")
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create job",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <AdminLoading />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Job</h1>
      <Card className="max-w-3xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Title</label>
            <input name="title" value={formData.title} onChange={handleChange} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block font-medium">Company</label>
            <input name="company" value={formData.company} onChange={handleChange} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block font-medium">Location</label>
            <input name="location" value={formData.location} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium">Job Type</label>
              <select name="job_type" value={formData.job_type} onChange={handleJobTypeChange} className="w-full border rounded p-2">
                {jobTypes.map((type) => (
                  <option key={type} value={type}>{type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-medium">Deadline</label>
              <input name="deadline" type="date" value={formData.deadline} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
          </div>
          <div>
            <label className="block font-medium">Salary Range</label>
            <input  name="salary_range" value={formData.salary_range} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block font-medium">Requirements</label>
            <textarea name="requirements" value={formData.requirements} onChange={handleChange} className="w-full border rounded p-2" rows={2} />
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded p-2" rows={4} />
          </div>
          <div>
            <label className="block font-medium">Apply URL</label>
            <input name="link" value={formData.link} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block font-medium">Featured</label>
            <input type="checkbox" name="featured" checked={formData.featured} onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))} />
            <span className="ml-2">Feature this job</span>
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <Button type="submit" className="w-full">Add Job</Button>
        </form>
      </Card>
    </div>
  )
}
