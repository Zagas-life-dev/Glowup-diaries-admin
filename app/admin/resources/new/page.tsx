"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminLoading } from "@/components/admin/loading"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { ArrowLeft, AlertCircle, Upload } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "@/hooks/use-toast"

interface ResourceFormData {
  id: string;
  title: string;
  description: string;
  category: string;
  is_premium: boolean;
  price: number;
  featured: boolean;
  file_url?: string;
  link?: string;
}

const categories = [
  "Career Development",
  "Study Materials",
  "Templates",
  "Guides",
  "Worksheets",
  "Courses",
  "Other"
]

export default function NewResourcePage() {
  const [formData, setFormData] = useState<ResourceFormData>({
    id: uuidv4(),
    title: "",
    description: "",
    category: "",
    is_premium: false,
    price: 0,
    featured: false,
    link: "",
  })
  
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let fileUrl = null

      if (!formData.is_premium && file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        
        // Upload file with public access
        const { error: uploadError } = await supabase.storage
          .from("resource-bucket")
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Error uploading file: ${uploadError.message}`)
        }

        // Get the public URL right after upload
        const { data: publicUrlData } = supabase.storage
          .from("resource-bucket")
          .getPublicUrl(fileName)
        
        if (!publicUrlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded file')
        }
        
        fileUrl = publicUrlData.publicUrl
      }

      const { error: insertError } = await supabase
        .from("resources")
        .insert({
          ...formData,
          file_url: formData.is_premium ? formData.link : fileUrl,
          price: formData.is_premium ? formData.price : 0,
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      toast({
        title: "Resource created",
        description: "The resource has been successfully created.",
      })

      router.push("/admin/resources")
    } catch (error: any) {
      setError(error.message || "Failed to create resource")
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create resource",
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
        <h1 className="text-2xl font-bold">Add New Resource</h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
          <CardDescription>Fill in the details for the new resource</CardDescription>
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_premium"
                checked={formData.is_premium}
                onChange={(e) => setFormData(prev => ({ ...prev, is_premium: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_premium">This is a premium resource</Label>
            </div>

            {formData.is_premium ? (
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
                <Label htmlFor="file">Upload Resource File</Label>
                <div className="flex items-center">
                  <Input id="file" type="file" onChange={handleFileChange} className="hidden" required />
                  <Label
                    htmlFor="file"
                    className="cursor-pointer flex items-center justify-center border-2 border-dashed rounded-md p-4 w-full"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">{file ? file.name : "Click to upload file"}</span>
                      {!file && <span className="text-xs text-gray-500 mt-1">PDF, DOC, or other resource files</span>}
                    </div>
                  </Label>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="featured">Feature this resource on homepage</Label>
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="w-full bg-brand-orange hover:bg-brand-orange/90">
                {loading ? "Creating Resource..." : "Create Resource"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-gray-500">Resources will be visible to all users after creation</p>
        </CardFooter>
      </Card>
    </div>
  )
}