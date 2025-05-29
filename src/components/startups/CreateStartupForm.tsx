
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState, useRef } from "react";
import { Rocket, Loader2, FileUp, Link as LinkIconLucide } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { Startup } from "@/types";
import { uploadImagePlaceholder } from "@/lib/imageUploader";

const startupStatus = ["idea", "developing", "launched", "scaling", "acquired"] as const;

const startupFormSchema = z.object({
  name: z.string().min(2, "Startup name must be at least 2 characters.").max(50, "Startup name is too long."),
  description: z.string().min(20, "Description must be at least 20 characters.").max(1000, "Description is too long."),
  status: z.enum(startupStatus),
  techStack: z.array(z.string()).max(10, "You can add up to 10 tech stack items.").optional(),
  tags: z.array(z.string()).max(10, "You can add up to 10 tags.").optional(),
  websiteUrl: z.string().url("Invalid website URL (must be a full URL e.g., https://...).").optional().or(z.literal("")),
});

type StartupFormValues = z.infer<typeof startupFormSchema>;

export function CreateStartupForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [selectedScreenshotFile, setSelectedScreenshotFile] = useState<File | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StartupFormValues>({
    resolver: zodResolver(startupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "idea",
      techStack: [],
      tags: [],
      websiteUrl: "",
    },
  });

  const descriptionContent = form.watch("description");

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedLogoFile(event.target.files[0]);
    } else {
      setSelectedLogoFile(null);
    }
  };

  const handleScreenshotFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedScreenshotFile(event.target.files[0]);
    } else {
      setSelectedScreenshotFile(null);
    }
  };

  async function onSubmit(data: StartupFormValues) {
    if (!user) {
      toast({ title: "Please sign in to create a startup.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    let logoUrl: string | null = null;
    if (selectedLogoFile) {
      try {
        logoUrl = await uploadImagePlaceholder(selectedLogoFile);
      } catch (error: any) {
        console.error("Logo upload error:", error);
        toast({ title: "Logo Upload Failed", description: error?.message || "Could not process the logo.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }

    let screenshotUrls: string[] = [];
    if (selectedScreenshotFile) {
      try {
        const screenshotUrl = await uploadImagePlaceholder(selectedScreenshotFile);
        screenshotUrls.push(screenshotUrl);
      } catch (error: any) {
        console.error("Screenshot upload error:", error);
        toast({ title: "Screenshot Upload Failed", description: error?.message || "Could not process the screenshot.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    }
    
    const startupData: Omit<Startup, "id" | "createdAt"> & { createdAt: any } = {
      name: data.name,
      logoUrl: logoUrl,
      description: data.description,
      status: data.status,
      techStack: data.techStack || [],
      tags: data.tags || [],
      websiteUrl: data.websiteUrl || null,
      screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : null,
      creatorId: user.uid,
      coFounderIds: [user.uid], 
      followerCount: 0,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "startups"), startupData);
      toast({ title: "Startup created!", description: `${data.name} is now showcased.` });
      form.reset();
      setSelectedLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      setSelectedScreenshotFile(null);
      if (screenshotInputRef.current) screenshotInputRef.current.value = "";
      router.push(`/startups/${docRef.id}`);
    } catch (error: any) {
      console.error("Error creating startup:", error);
      toast({
        title: "Startup Creation Failed",
        description: error.message || "Could not save your startup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" /> Startup Logo (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoFileChange} 
                  ref={logoInputRef}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </FormControl>
              {selectedLogoFile && (
                <FormDescription className="text-xs">
                  Selected: {selectedLogoFile.name} ({(selectedLogoFile.size / 1024).toFixed(2)} KB)
                </FormDescription>
              )}
            </FormItem>

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
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                     <LinkIconLucide className="h-4 w-4 text-muted-foreground" /> Website URL (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" /> Startup Screenshot (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleScreenshotFileChange} 
                  ref={screenshotInputRef}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </FormControl>
              {selectedScreenshotFile && (
                <FormDescription className="text-xs">
                  Selected: {selectedScreenshotFile.name} ({(selectedScreenshotFile.size / 1024).toFixed(2)} KB)
                </FormDescription>
              )}
              <FormDescription>Upload one key screenshot of your product.</FormDescription>
            </FormItem>


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
                  <FormLabel>Tech Stack (Optional)</FormLabel>
                  <FormControl>
                     <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="e.g., React, Node.js, Python"
                      />
                  </FormControl>
                  <FormDescription>List the main technologies your startup uses. Max 10.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (Optional)</FormLabel>
                  <FormControl>
                     <TagInput
                        value={field.value || []}
                        onChange={field.onChange}
                        placeholder="e.g., SaaS, AI, Fintech"
                        contentForSuggestions={descriptionContent}
                      />
                  </FormControl>
                  <FormDescription>Help people discover your startup. Max 10.</FormDescription>
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
