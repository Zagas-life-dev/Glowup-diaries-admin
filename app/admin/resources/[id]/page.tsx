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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AdminLoading } from "@/components/admin/loading"
import { v4 as uuidv4 } from "uuid"

interface ResourceFormData {
  id: string
  title: string
  description: string
  category: string
  is_premium: boolean
  price: number
  link: string
  file_url?: string
  featured: boolean
}

export default function EditResourcePage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState<ResourceFormData | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("id", params.id)
          .single()

        if (error) throw error
        if (!data) throw new Error("Resource not found")

        setFormData(data)
      } catch (error: any) {
        setError(error.message)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to fetch resource",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [params.id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => prev ? ({ ...prev, [name]: value }) : null)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => prev ? ({ ...prev, [name]: parseFloat(value) || 0 }) : null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setLoading(true)
    setError(null)

    try {
      let fileUrl = formData.file_url

      // Handle file upload if a new file is selected
      if (!formData.is_premium && file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from("resource-bucket")
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          })

        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`)
        }

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from("resource-bucket")
          .getPublicUrl(fileName)

        fileUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from("resources")
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          is_premium: formData.is_premium,
          price: formData.is_premium ? formData.price : 0,
          link: formData.is_premium ? formData.link : "",
          file_url: fileUrl,
          featured: formData.featured
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Resource updated successfully",
      })
      router.push("/admin/resources")
    } catch (error: any) {
      setError(error.message)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update resource",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <AdminLoading />
  if (!formData) return <Alert><AlertDescription>Resource not found</AlertDescription></Alert>

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Resource</CardTitle>
          <CardDescription>Update the resource details below.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Resource Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter resource title"
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
                placeholder="Describe the resource"
                rows={4}
                required
              />
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
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="ebook">E-Book</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => 
                  setFormData(prev => prev ? ({ ...prev, is_premium: checked }) : null)
                }
              />
              <Label htmlFor="is_premium">This is a premium resource</Label>
            </div>

            {formData.is_premium ? (
              <div>
                <div className="space-y-2">
                  <Label htmlFor="link">Resource Link</Label>
                  <Input
                    id="link"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="Enter resource link (e.g., course platform URL)"
                    required
                  />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleNumberChange}
                    placeholder="Enter price"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="file">Update Resource File (Optional)</Label>
                <div className="flex items-center">
                  <Input 
                    id="file" 
                    type="file" 
                    onChange={handleFileChange} 
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                  />
                </div>
                {formData.file_url && (
                  <p className="text-sm text-gray-500 mt-2">
                    Current file: {formData.file_url.split("/").pop()}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => prev ? ({ ...prev, featured: e.target.checked }) : null)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="featured">Feature this resource on homepage</Label>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/resources")}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-orange hover:bg-brand-orange/90">
                {loading ? "Updating Resource..." : "Update Resource"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}