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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput"; // Reusing for skills, languages
import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import type { UserProfile } from "@/types"; // For initial values

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50),
  avatarUrl: z.string().url("Invalid URL.").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional(),
  skills: z.array(z.string()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  // For simplicity, external links will be a text area for now, or a more complex field array later
  externalLinksText: z.string().optional().describe("Enter links one per line: Name - URL"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Mock current user profile data for pre-filling the form
const mockCurrentProfileData: Partial<UserProfile> = {
    displayName: "Alice W.",
    avatarUrl: "https://placehold.co/200x200.png",
    bio: "Full-stack developer passionate about creating intuitive user experiences.",
    skills: ["JavaScript", "React", "Node.js"],
    preferredLanguages: ["English"],
    externalLinks: [{ name: "GitHub", url: "https://github.com" }],
};


export function EditProfileForm() {
  const { user } = useAuth(); // Assuming this gives FirebaseUser + basic profile
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Fetch full UserProfile data here using user.uid and set as defaultValues
  // For now, using mock data.
  const initialProfileData = user ? {
    ...mockCurrentProfileData, // from a fetch
    displayName: user.displayName || mockCurrentProfileData.displayName || "",
    avatarUrl: user.photoURL || mockCurrentProfileData.avatarUrl || "",
    externalLinksText: mockCurrentProfileData.externalLinks?.map(l => `${l.name} - ${l.url}`).join('\n') || "",
  } : {};


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialProfileData as ProfileFormValues, // Type assertion
  });
  
  useEffect(() => {
     // Reset form if user or initial data changes
     if (user) {
        form.reset(initialProfileData as ProfileFormValues);
     }
  }, [user, form]);


  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({ title: "You must be signed in to edit your profile.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    console.log("Updating profile:", data);
    // TODO: Implement actual profile update logic (e.g., save to Firestore, update Firebase Auth profile)
    // Parse externalLinksText back into array of objects if needed
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    toast({ title: "Profile updated!", description: "Your changes have been saved." });
    setIsLoading(false);
  }

  if (!user) {
      return <Card><CardContent className="p-6 text-center text-muted-foreground">Please sign in to edit your profile.</CardContent></Card>
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Edit Your Profile</CardTitle>
        <CardDescription>Keep your DevNet profile up-to-date.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/avatar.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us a bit about yourself..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills (Optional)</FormLabel>
                  <FormControl>
                    <TagInput value={field.value || []} onChange={field.onChange} placeholder="Add skills (e.g., React, Python)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredLanguages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Languages (Optional)</FormLabel>
                  <FormControl>
                    <TagInput value={field.value || []} onChange={field.onChange} placeholder="Add languages (e.g., English, Spanish)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="externalLinksText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Links (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="GitHub - https://github.com/username&#10;LinkedIn - https://linkedin.com/in/profile" className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormDescription>Enter one link per line in the format: Name - URL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
