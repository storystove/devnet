
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput";
import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import { Rocket, Loader2, FileUp, Link as LinkIconLucide, Save, Trash2, UploadCloud, FileImage, XCircle } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { Startup } from "@/types";
import { uploadImagePlaceholder } from "@/lib/imageUploader";
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

  const [existingScreenshotUrls, setExistingScreenshotUrls] = useState<string[]>(startup.screenshotUrls || []);
  const [newScreenshotFiles, setNewScreenshotFiles] = useState<File[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOverScreenshots, setIsDraggingOverScreenshots] = useState(false);
  
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
    setExistingScreenshotUrls(startup.screenshotUrls || []);
    setNewScreenshotFiles([]); // Clear any new files when startup data changes
  }, [startup, form]);


  const descriptionContent = form.watch("description");

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      // If deselected, revert to original or clear if original was null
      setSelectedLogoFile(null); 
      setLogoPreview(startup.logoUrl || null);
    }
  };
  
  const removeLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreview(null); // This indicates intent to remove existing logo
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleNewScreenshotFiles = (files: FileList | null) => {
    if (files) {
      const newFilesArray = Array.from(files);
      const imageFiles = newFilesArray.filter(file => file.type.startsWith('image/'));
       if (imageFiles.length !== newFilesArray.length) {
        toast({ title: "Invalid File Type", description: "Only image files are allowed for screenshots.", variant: "destructive"});
      }
      setNewScreenshotFiles(prevFiles => [...prevFiles, ...imageFiles].slice(0, 5 - existingScreenshotUrls.length)); // Limit total screenshots
    }
  };

  const handleScreenshotInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleNewScreenshotFiles(event.target.files);
    if (event.target) event.target.value = ""; 
  };

  const removeNewScreenshotFile = (index: number) => {
    setNewScreenshotFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const removeExistingScreenshotUrl = (index: number) => {
    setExistingScreenshotUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  const onScreenshotDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOverScreenshots(true);
  }, []);

  const onScreenshotDragLeave = useCallback(() => {
    setIsDraggingOverScreenshots(false);
  }, []);

  const onScreenshotDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOverScreenshots(false);
    handleNewScreenshotFiles(event.dataTransfer.files);
  }, []);

  async function onSubmit(data: StartupFormValues) {
    if (!user || user.uid !== startup.creatorId) {
      toast({ title: "Unauthorized", description: "You are not allowed to edit this startup.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    let finalLogoUrl: string | null = startup.logoUrl; 
    if (selectedLogoFile) {
      try {
        finalLogoUrl = await uploadImagePlaceholder(selectedLogoFile);
      } catch (error: any) {
        toast({ title: "Logo Upload Failed", description: error?.message || "Could not process the logo.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
    } else if (logoPreview === null) { // If preview is null, means user removed/cleared it
        finalLogoUrl = null;
    }


    const uploadedNewScreenshotUrls: string[] = [];
    if (newScreenshotFiles.length > 0) {
      for (const file of newScreenshotFiles) {
        try {
          const url = await uploadImagePlaceholder(file);
          uploadedNewScreenshotUrls.push(url);
        } catch (error: any) {
          toast({ title: "Screenshot Upload Failed", description: `Could not upload ${file.name}. ${error?.message || ""}`, variant: "destructive" });
          setIsLoading(false);
          return;
        }
      }
    }
    
    const finalScreenshotUrls = [...existingScreenshotUrls, ...uploadedNewScreenshotUrls].slice(0,5); // Combine and limit
    
    const startupUpdateData: Partial<Startup> & { updatedAt: any } = {
      name: data.name,
      description: data.description,
      status: data.status,
      techStack: data.techStack || [],
      tags: data.tags || [],
      websiteUrl: data.websiteUrl || null,
      logoUrl: finalLogoUrl,
      screenshotUrls: finalScreenshotUrls.length > 0 ? finalScreenshotUrls : null,
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
        <ShadCNCardDescription>Update the details for your startup.</ShadCNCardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" className="rounded border" data-ai-hint="company logo preview"/>
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 z-10" onClick={removeLogo} title="Remove logo">
                    <XCircle className="h-3 w-3"/>
                  </Button>
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
                <UploadCloud className="h-5 w-5 text-muted-foreground" /> Startup Screenshots (Optional, up to 5 total)
              </FormLabel>
              
              {existingScreenshotUrls.length > 0 && (
                <div className="mt-2 mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Current screenshots:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {existingScreenshotUrls.map((url, index) => (
                      <div key={url} className="relative group aspect-square">
                        <Image
                          src={url}
                          alt={`Existing screenshot ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md border"
                          data-ai-hint="startup screenshot existing"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => { e.stopPropagation(); removeExistingScreenshotUrl(index);}}
                          title="Remove screenshot"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormLabel className="text-sm font-normal text-muted-foreground mt-4 block">Add new screenshots:</FormLabel>
              <div 
                className={`mt-1 flex justify-center rounded-md border-2 border-dashed px-6 pt-5 pb-6 transition-colors
                  ${isDraggingOverScreenshots ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                onDragOver={onScreenshotDragOver}
                onDragLeave={onScreenshotDragLeave}
                onDrop={onScreenshotDrop}
                onClick={() => screenshotInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <span className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                      Upload files
                    </span>
                    <input ref={screenshotInputRef} id="new-screenshot-upload" name="new-screenshot-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleScreenshotInputChange} />
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
                </div>
              </div>
              {newScreenshotFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">New screenshots to upload:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {newScreenshotFiles.map((file, index) => (
                      <div key={index} className="relative group aspect-square">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`New screenshot preview ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => { e.stopPropagation(); removeNewScreenshotFile(index);}}
                          title="Remove screenshot"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FormDescription>Upload new screenshots. You can have up to 5 screenshots in total.</FormDescription>
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

    