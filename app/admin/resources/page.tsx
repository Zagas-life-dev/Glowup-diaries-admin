"use client"

import { useState, useEffect } from "react"
import { Eye, Edit, Trash, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AdminLoading } from "@/components/admin/loading"
import { Badge } from "@/components/ui/badge"

interface Resource {
  id: string
  title: string
  description: string
  category: string
  is_premium: boolean
  price: number
  featured: boolean
  file_url: string
  created_at: string
}

export default function ResourcesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<Resource[]>([])
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setResources(data || [])
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch resources",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteResource = async (id: string) => {
    try {
      // First get the resource to check if it has a file
      const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // If there's a file_url and it's in our storage (not a premium external link)
      if (resource.file_url && resource.file_url.includes('resource-bucket')) {
        // Extract the path from the URL
        const path = resource.file_url.split('resource-bucket/')[1]
        
        // Delete the file from storage
        const { error: deleteFileError } = await supabase.storage
          .from('resource-bucket')
          .remove([path])

        if (deleteFileError) throw deleteFileError
      }

      // Delete the resource record
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setResources(resources.filter((r) => r.id !== id))
      toast({
        title: "Resource deleted",
        description: "The resource has been removed from the site.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete resource",
      })
    }
  }

  if (loading) {
    return <AdminLoading />
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resources Management</h1>
        <Button onClick={() => router.push("/admin/resources/new")} className="bg-brand-orange hover:bg-brand-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Resource
        </Button>
      </div>

      {resources.length === 0 ? (
        <p className="text-gray-500">No resources available.</p>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{resource.title}</CardTitle>
                    <CardDescription>{resource.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{resource.category}</Badge>
                    {resource.featured && <Badge className="bg-amber-500">Featured</Badge>}
                    <Badge variant={resource.is_premium ? "default" : "outline"}>
                      {resource.is_premium ? `Premium - $${resource.price}` : "Free"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  <p>Created: {new Date(resource.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.open(resource.file_url, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => router.push(`/admin/resources/${resource.id}`)}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => deleteResource(resource.id)}
                >
                  <Trash className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}