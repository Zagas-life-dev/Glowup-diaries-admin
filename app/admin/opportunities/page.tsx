"use client"

import { useState, useEffect } from "react"
import { Check, X, Edit, Trash, Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { AdminLoading } from "@/components/admin/loading"
import { isBefore, parseISO } from 'date-fns'
import { cn } from "@/lib/utils"

interface Submission {
  id: string
  submitter_name: string
  submitter_email: string
  title: string
  description: string
  submission_type: "opportunity"
  deadline: string
  eligibility: string
  category: string

  link: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

interface Opportunity {
  id: string
  title: string
  description: string
  deadline: string
  eligibility: string
  category: string
  
  featured: boolean
  created_at: string
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingOpportunities, setPendingOpportunities] = useState<Submission[]>([]);
  const [publishedOpportunities, setPublishedOpportunities] = useState<Opportunity[]>([]);
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const supabase = getSupabaseBrowserClient();

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPublishedOpportunities(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch opportunities",
      });
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('submission_type', 'opportunity')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingOpportunities(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch pending submissions",
      });
    }
  };

  const cleanupPastOpportunities = async () => {
    try {
      const now = new Date()
      const { data: expiredOpportunities, error: fetchError } = await supabase
        .from('opportunities')
        .select('id, deadline')
        .order('deadline', { ascending: true })

      if (fetchError) throw fetchError

      const opportunitiesToDelete = expiredOpportunities?.filter(opp => {
        const deadlineDate = parseISO(`${opp.deadline}`)
        return isBefore(deadlineDate, now)
      }) || []

      if (opportunitiesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('opportunities')
          .delete()
          .in('id', opportunitiesToDelete.map(o => o.id))

        if (deleteError) throw deleteError

        // Update the local state to remove deleted opportunities
        setPublishedOpportunities(current => 
          current.filter(opp => !opportunitiesToDelete.some(o => o.id === opp.id))
        )

        toast({
          title: "Cleanup completed",
          description: `${opportunitiesToDelete.length} past opportunities have been removed.`,
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cleanup past opportunities",
      })
    }
  }

  useEffect(() => {
    fetchOpportunities()
    fetchPendingSubmissions()
    // Run cleanup when the page loads
    cleanupPastOpportunities()
    
    // Set up an interval to check for past opportunities every hour
    const cleanup = setInterval(cleanupPastOpportunities, 1000 * 60 * 60)
    
    return () => clearInterval(cleanup)
  }, [])

  const approveSubmission = async (id: string) => {
    setProcessing((prev) => ({ ...prev, [id]: true }));
    
    try {
      // Get the submission details
      const { data: submission, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!submission) throw new Error('Submission not found');

      // Insert into opportunities table
      const { error: insertError } = await supabase
        .from('opportunities')
        .insert({
          title: submission.title,
          description: submission.description,
          deadline: submission.deadline,
          eligibility: submission.eligibility,
          category: submission.category,
          is_free: submission.is_free,
          link: submission.link,
          featured: false
        });

      if (insertError) throw insertError;

      // Delete from submissions table
      const { error: deleteError } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setPendingOpportunities(current => current.filter(s => s.id !== id));
      fetchOpportunities(); // Refresh published opportunities

      toast({
        title: "Success",
        description: "Opportunity has been approved and published.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve submission",
      });
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const rejectSubmission = async (id: string) => {
    setProcessing((prev) => ({ ...prev, [id]: true }));
    
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPendingOpportunities(current => current.filter(s => s.id !== id));
      toast({
        title: "Submission rejected",
        description: "The submission has been rejected.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject submission",
      });
    } finally {
      setProcessing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleFeature = async (id: string) => {
    try {
      const opportunity = publishedOpportunities.find(o => o.id === id);
      if (!opportunity) return;

      const { error } = await supabase
        .from('opportunities')
        .update({ featured: !opportunity.featured })
        .eq('id', id);

      if (error) throw error;

      setPublishedOpportunities(opportunities =>
        opportunities.map(o => o.id === id ? { ...o, featured: !o.featured } : o)
      );

      toast({
        title: "Featured status updated",
        description: "The opportunity's featured status has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update featured status",
      });
    }
  };

  const deleteOpportunity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPublishedOpportunities(publishedOpportunities.filter((o) => o.id !== id));
      toast({
        title: "Opportunity deleted",
        description: "The opportunity has been removed from the site.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete opportunity",
      });
      console.error('Error deleting opportunity:', error);
    }
  };

  if (loading) {
    return <AdminLoading />;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Opportunities Management</h1>
        <Button onClick={() => router.push("/admin/opportunities/new")} className="bg-brand-orange hover:bg-brand-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Opportunity
        </Button>
      </div>
      
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Opportunities</TabsTrigger>
          <TabsTrigger value="published">Published Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingOpportunities.length === 0 ? (
            <p className="text-gray-500">No pending opportunities to review.</p>
          ) : (
            <div className="grid gap-4">
              {pendingOpportunities.map((opportunity) => (
                <Card key={opportunity.id}>
                  <CardHeader>
                    <CardTitle>{opportunity.title}</CardTitle>
                    <CardDescription>{opportunity.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      <p>Submitted by: {opportunity.submitter_name}</p>
                      <p>Submitted on: {new Date(opportunity.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => rejectSubmission(opportunity.id)}
                      disabled={processing[opportunity.id]}
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveSubmission(opportunity.id)}
                      disabled={processing[opportunity.id]}
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          {publishedOpportunities.length === 0 ? (
            <p className="text-gray-500">No published opportunities.</p>
          ) : (
            <div className="grid gap-4">
              {publishedOpportunities.map((opportunity) => (
                <Card key={opportunity.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{opportunity.title}</CardTitle>
                        <CardDescription>{opportunity.description}</CardDescription>
                      </div>
                      {opportunity.featured && <Badge className="bg-amber-500">Featured</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500">
                      <p>Category: {opportunity.category}</p>
                      <p>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</p>
                      
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => router.push(`/admin/opportunities/${opportunity.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex items-center gap-1",
                        opportunity.featured ? "bg-amber-100 hover:bg-amber-200" : "hover:bg-amber-100"
                      )}
                      onClick={() => toggleFeature(opportunity.id)}
                    >
                      <Star className={cn("h-4 w-4", opportunity.featured ? "fill-amber-500" : "")} />
                      <span>{opportunity.featured ? "Unfeature" : "Feature"}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => deleteOpportunity(opportunity.id)}
                    >
                      <Trash className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}