"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput";
import { useState } from "react";
import { Rocket, Loader2 } from "lucide-react";

const startupStatus = ["idea", "developing", "launched", "scaling", "acquired"] as const;

const startupFormSchema = z.object({
  name: z.string().min(2, "Startup name must be at least 2 characters.").max(50, "Startup name is too long."),
  logoUrl: z.string().url("Invalid logo URL.").optional().or(z.literal("")),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000, "Description is too long."),
  status: z.enum(startupStatus),
  techStack: z.array(z.string()).optional(), // Using TagInput for this as well
  tags: z.array(z.string()).optional(),
});

type StartupFormValues = z.infer<typeof startupFormSchema>;

export function CreateStartupForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StartupFormValues>({
    resolver: zodResolver(startupFormSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      description: "",
      status: "idea",
      techStack: [],
      tags: [],
    },
  });

  const descriptionContent = form.watch("description"); // For tag suggestions

  async function onSubmit(data: StartupFormValues) {
    if (!user) {
      toast({ title: "Please sign in to create a startup.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    console.log("Creating startup:", data);
    // TODO: Implement actual startup creation logic (e.g., save to Firestore)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    toast({ title: "Startup created!", description: `${data.name} is now showcased.` });
    form.reset();
    setIsLoading(false);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Showcase Your Startup</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Startup Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Startup" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your startup, its mission, and vision..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select startup status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {startupStatus.map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="techStack"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tech Stack</FormLabel>
                  <FormControl>
                     <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="e.g., React, Node.js, Python"
                      />
                  </FormControl>
                  <FormDescription>List the main technologies your startup uses.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                     <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="e.g., SaaS, AI, Fintech"
                        contentForSuggestions={descriptionContent}
                      />
                  </FormControl>
                  <FormDescription>Help people discover your startup.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !user}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              {user ? "Create Startup" : "Sign in to Create"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
