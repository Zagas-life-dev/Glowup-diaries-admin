"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface OpportunityFormData {
  name: string
  email: string
  title: string
  description: string
  deadline: string
  eligibility: string
  category: string

  link: string
}

export default function OpportunitySubmissionForm() {
  const supabase = getSupabaseBrowserClient() // Move to component level
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [opportunityForm, setOpportunityForm] = useState<OpportunityFormData>({
    name: "",
    email: "",
    title: "",
    description: "",
    deadline: "",
    eligibility: "",
    category: "",
    link: "",
  })

  const handleOpportunityChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setOpportunityForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setOpportunityForm(prev => ({
        ...prev,
        deadline: format(date, "yyyy-MM-dd")
      }))
    }
  }

  const checkOpportunityFormValidity = () => {
    return (
      opportunityForm.name.trim() !== "" &&
      opportunityForm.email.trim() !== "" &&
      opportunityForm.title.trim() !== "" &&
      opportunityForm.description.trim() !== "" &&
      opportunityForm.deadline.trim() !== "" &&
      opportunityForm.eligibility.trim() !== "" &&
      opportunityForm.category.trim() !== "" &&
      opportunityForm.link.trim() !== ""
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', opportunityForm) // Add logging
    
    if (!checkOpportunityFormValidity()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      })
      return
    }
    
    try {
      // Create the submission object
      const submission = {
        submitter_name: opportunityForm.name,
        submitter_email: opportunityForm.email,
        title: opportunityForm.title,
        description: opportunityForm.description,
        submission_type: "opportunity",
        deadline: opportunityForm.deadline,
        eligibility: opportunityForm.eligibility,
        category: opportunityForm.category,
        link: opportunityForm.link,
        status: "pending"
      }

      console.log('Submitting to Supabase:', submission) // Add logging

      const { data, error } = await supabase
        .from("submissions")
        .insert([submission])
        .select() // Add select to confirm insertion

      if (error) {
        console.error('Supabase error:', error) // Add detailed error logging
        throw error
      }

      console.log('Submission successful:', data) // Add success logging

      toast({
        title: "Success",
        description: "Thank you for submitting your opportunity! It will be reviewed by our team.",
      })
      
      // Reset form
      setOpportunityForm({
        name: "",
        email: "",
        title: "",
        description: "",
        deadline: "",
        eligibility: "",
        category: "",
        link: ""
      })
      setSelectedDate(undefined)
    } catch (error: any) {
      console.error('Submission error details:', error) // Add detailed error logging
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit opportunity",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit an Opportunity</CardTitle>
        <CardDescription>
          Share details about an opportunity that would benefit our community.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-name">Your Name</Label>
              <Input
                id="opp-name"
                name="name"
                value={opportunityForm.name}
                onChange={handleOpportunityChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opp-email">Your Email</Label>
              <Input
                id="opp-email"
                name="email"
                type="email"
                value={opportunityForm.email}
                onChange={handleOpportunityChange}
                placeholder="Your email address"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-title">Opportunity Title</Label>
            <Input
              id="opp-title"
              name="title"
              value={opportunityForm.title}
              onChange={handleOpportunityChange}
              placeholder="Title of the opportunity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opp-description">Opportunity Description</Label>
            <Textarea
              id="opp-description"
              name="description"
              value={opportunityForm.description}
              onChange={handleOpportunityChange}
              placeholder="Describe the opportunity"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Application Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label htmlFor="opp-eligibility">Eligibility</Label>
              <Input
                id="opp-eligibility"
                name="eligibility"
                value={opportunityForm.eligibility}
                onChange={handleOpportunityChange}
                placeholder="Who can apply?"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opp-category">Category</Label>
              <Select
                value={opportunityForm.category}
                onValueChange={(value) => setOpportunityForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="opp-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="fellowship">Fellowship</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                  <SelectItem value="contest">Contest</SelectItem>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="accelerator">Accelerator</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
            <Label htmlFor="opp-link">Application/Info Link</Label>
            <Input
              id="opp-link"
              name="link"
              type="url"
              value={opportunityForm.link}
              onChange={handleOpportunityChange}
              placeholder="https://..."
              required
            />
          </div>
            
          </div>



          <Button type="submit" className="w-full">
            Submit Opportunity
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start text-sm text-muted-foreground">
        <p>
          By submitting, you agree to our{" "}
          <a href="/terms" className="text-blue-500 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-blue-500 hover:underline">
            Privacy Policy
          </a>.
        </p>
      </CardFooter>
    </Card>
  )
}