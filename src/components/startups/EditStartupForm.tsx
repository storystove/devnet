
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
import { useState, useRef, useEffect } from "react";
import { Rocket, Loader2, FileUp, Link as LinkIconLucide, Save, Trash2 } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { Startup } from "@/types";
import { uploadImagePlaceholder } from "@/lib/imageUploader"; // Assuming this exists
import Image from "next/image";

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

interface EditStartupFormProps {
  startup: Startup;
}

export function EditStartupForm({ startup }: EditStartupFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(startup.logoUrl || null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [selectedScreenshotFile, setSelectedScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(startup.screenshotUrls?.[0] || null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<StartupFormValues>({
    resolver: zodResolver(startupFormSchema),
    defaultValues: {
      name: startup.name || "",
      description: startup.description || "",
      status: startup.status || "idea",
      techStack: startup.techStack || [],
      tags: startup.tags || [],
      websiteUrl: startup.websiteUrl || "",
    },
  });
  
  useEffect(() => {
    form.reset({
      name: startup.name || "",
      description: startup.description || "",
      status: startup.status || "idea",
      techStack: startup.techStack || [],
      tags: startup.tags || [],
      websiteUrl: startup.websiteUrl || "",
    });
    setLogoPreview(startup.logoUrl || null);
    setScreenshotPreview(startup.screenshotUrls?.[0] || null);
  }, [startup, form]);


  const descriptionContent = form.watch("description");

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setSelectedLogoFile(null);
      // setLogoPreview(startup.logoUrl || null); // Keep existing if no new file
    }
  };
  
  const removeLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleScreenshotFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    } else {
      setSelectedScreenshotFile(null);
      // setScreenshotPreview(startup.screenshotUrls?.[0] || null); // Keep existing if no new file
    }
  };

  const removeScreenshot = () => {
    setSelectedScreenshotFile(null);
    setScreenshotPreview(null);
    if (screenshotInputRef.current) screenshotInputRef.current.value = "";
  };


  async function onSubmit(data: StartupFormValues) {
    if (!user || user.uid !== startup.creatorId) {
      toast({ title: "Unauthorized", description: "You are not allowed to edit this startup.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    let updatedLogoUrl: string | null | undefined = startup.logoUrl; // Keep existing by default
    if (selectedLogoFile) {
      try {
        updatedLogoUrl = await uploadImagePlaceholder(selectedLogoFile);
      } catch (error: any) {
        toast({ title: "Logo Upload Failed", description: error?.message || "Could not process the logo.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } else if (logoPreview === null && startup.logoUrl !== null) { // Check if user explicitly removed it
        updatedLogoUrl = null;
    }


    let updatedScreenshotUrls: string[] | null = startup.screenshotUrls || [];
    if (selectedScreenshotFile) {
      try {
        const newScreenshotUrl = await uploadImagePlaceholder(selectedScreenshotFile);
        updatedScreenshotUrls = [newScreenshotUrl]; // For now, replace/set as single screenshot
      } catch (error: any) {
        toast({ title: "Screenshot Upload Failed", description: error?.message || "Could not process the screenshot.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } else if (screenshotPreview === null && startup.screenshotUrls && startup.screenshotUrls.length > 0) { // Check if user explicitly removed it
        updatedScreenshotUrls = null;
    }
    
    const startupUpdateData: Partial<Startup> & { updatedAt: any } = {
      name: data.name,
      description: data.description,
      status: data.status,
      techStack: data.techStack || [],
      tags: data.tags || [],
      websiteUrl: data.websiteUrl || null,
      logoUrl: updatedLogoUrl,
      screenshotUrls: updatedScreenshotUrls,
      updatedAt: serverTimestamp(),
    };

    try {
      const startupRef = doc(db, "startups", startup.id);
      await updateDoc(startupRef, startupUpdateData);
      toast({ title: "Startup updated!", description: `${data.name} has been successfully updated.` });
      router.push(`/startups/${startup.id}`);
    } catch (error: any) {
      console.error("Error updating startup:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update your startup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Edit {startup.name}</CardTitle>
        <FormDescription>Update the details for your startup.</FormDescription>
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
              {logoPreview && (
                <div className="my-2 relative w-24 h-24">
                  <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" className="rounded border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeLogo}><Trash2 className="h-3 w-3"/></Button>
                </div>
              )}
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
                  New: {selectedLogoFile.name} ({(selectedLogoFile.size / 1024).toFixed(2)} KB)
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
                    <Input type="url" placeholder="https://example.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" /> Startup Screenshot (Optional)
              </FormLabel>
               {screenshotPreview && (
                <div className="my-2 relative w-full aspect-video max-w-sm">
                  <Image src={screenshotPreview} alt="Screenshot preview" layout="fill" objectFit="contain" className="rounded border" />
                   <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={removeScreenshot}><Trash2 className="h-3 w-3"/></Button>
                </div>
              )}
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
                  New: {selectedScreenshotFile.name} ({(selectedScreenshotFile.size / 1024).toFixed(2)} KB)
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
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
