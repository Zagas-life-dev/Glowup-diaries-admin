"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AdminLoading } from "@/components/admin/loading"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface OpportunityFormData {
  id: string
  title: string
  description: string
  deadline: string
  eligibility: string
  category: string
  link: string
  is_free: boolean
  featured: boolean
}

const categories = [
  "Scholarship",
  "Fellowship",
  "Internship",
  "Grant",
  "Competition",
  "Mentorship",
  "Workshop",
  "Other"
]

export default function EditOpportunityPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<OpportunityFormData | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        const { data, error } = await supabase
          .from("opportunities")
          .select("*")
          .eq("id", params.id)
          .single()

        if (error) throw error
        if (!data) throw new Error("Opportunity not found")

        setFormData(data)
        if (data.deadline) {
          setSelectedDate(new Date(data.deadline))
        }
      } catch (error: any) {
        setError(error.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch opportunity",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOpportunity()
  }, [params.id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => prev ? ({ ...prev, [name]: value }) : null)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && formData) {
      setFormData({
        ...formData,
        deadline: format(date, "yyyy-MM-dd")
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          eligibility: formData.eligibility,
          category: formData.category,
          link: formData.link,
          is_free: formData.is_free,
          featured: formData.featured
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      })
      router.push("/admin/opportunities")
    } catch (error: any) {
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update opportunity",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <AdminLoading />
  if (!formData) return <Alert><AlertDescription>Opportunity not found</AlertDescription></Alert>

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Opportunity</CardTitle>
          <CardDescription>Update the opportunity details below.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Opportunity Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter opportunity title"
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
                placeholder="Describe the opportunity"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
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
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => prev ? ({ ...prev, category: value }) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eligibility">Eligibility Requirements</Label>
              <Textarea
                id="eligibility"
                name="eligibility"
                value={formData.eligibility}
                onChange={handleChange}
                placeholder="Enter eligibility requirements"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Application/Info Link</Label>
              <Input
                id="link"
                name="link"
                type="url"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://..."
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_free"
                checked={formData.is_free}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, is_free: e.target.checked }) : null)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_free">This is a free opportunity</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, featured: e.target.checked }) : null)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="featured">Feature this opportunity on homepage</Label>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/opportunities")}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90">
                {loading ? "Updating Opportunity..." : "Update Opportunity"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}