
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
import { useState, useRef, useCallback, DragEvent } from "react";
import { Rocket, Loader2, FileUp, Link as LinkIconLucide, UploadCloud, FileImage, XCircle } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { Startup } from "@/types";
import { uploadImagePlaceholder } from "@/lib/imageUploader";
import Image from "next/image";

const startupStatus = ["idea", "developing", "launched", "scaling", "acquired"] as const;
const MAX_SCREENSHOTS = 15;

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
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [selectedScreenshotFiles, setSelectedScreenshotFiles] = useState<File[]>([]);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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
      const file = event.target.files[0];
      setSelectedLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setSelectedLogoFile(null);
      setLogoPreview(null);
    }
  };

  const handleScreenshotFiles = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length !== newFiles.length) {
        toast({ title: "Invalid File Type", description: "Only image files are allowed for screenshots.", variant: "destructive"});
      }
      setSelectedScreenshotFiles(prevFiles => {
        const combined = [...prevFiles, ...imageFiles];
        if (combined.length > MAX_SCREENSHOTS) {
          toast({ title: "Screenshot Limit Reached", description: `You can upload a maximum of ${MAX_SCREENSHOTS} screenshots.`, variant: "default"});
        }
        return combined.slice(0, MAX_SCREENSHOTS);
      });
    }
  };

  const handleScreenshotInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleScreenshotFiles(event.target.files);
     if (event.target) event.target.value = ""; 
  };

  const removeScreenshotFile = (index: number) => {
    setSelectedScreenshotFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    handleScreenshotFiles(event.dataTransfer.files);
  }, []);


  async function onSubmit(data: StartupFormValues) {
    if (!user) {
      toast({ title: "Please sign in to create a startup.", variant: "destructive" });
      return;
    }
    if (selectedScreenshotFiles.length > MAX_SCREENSHOTS) {
      toast({ title: "Too Many Screenshots", description: `Please select no more than ${MAX_SCREENSHOTS} screenshots.`, variant: "destructive" });
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

    const uploadedScreenshotUrls: string[] = [];
    if (selectedScreenshotFiles.length > 0) {
      for (const file of selectedScreenshotFiles) {
        try {
          const url = await uploadImagePlaceholder(file);
          uploadedScreenshotUrls.push(url);
        } catch (error: any) {
          console.error(`Screenshot upload error for ${file.name}:`, error);
          toast({ title: "Screenshot Upload Failed", description: `Could not upload ${file.name}. ${error?.message || ""}`, variant: "destructive" });
          setIsLoading(false);
          return; 
        }
      }
    }
    
    const techStackToSave = Array.isArray(data.techStack) ? data.techStack : [];
    const tagsToSave = Array.isArray(data.tags) ? data.tags : [];

    const startupData: Omit<Startup, "id" | "createdAt"> & { createdAt: any } = {
      name: data.name,
      logoUrl: logoUrl,
      description: data.description,
      status: data.status,
      techStack: techStackToSave,
      tags: tagsToSave,
      websiteUrl: data.websiteUrl || null,
      screenshotUrls: uploadedScreenshotUrls.length > 0 ? uploadedScreenshotUrls : null,
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
      setLogoPreview(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      setSelectedScreenshotFiles([]);
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
                    <Input type="url" placeholder="https://example.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-muted-foreground" /> Startup Screenshots (Optional, up to {MAX_SCREENSHOTS})
              </FormLabel>
              <div 
                className={`mt-1 flex justify-center rounded-md border-2 border-dashed px-6 pt-5 pb-6 transition-colors
                  ${isDraggingOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => screenshotInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <span className="relative cursor-pointer rounded-md bg-background font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                      Upload files
                    </span>
                    <input ref={screenshotInputRef} id="screenshot-upload" name="screenshot-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleScreenshotInputChange} />
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each. Max {MAX_SCREENSHOTS} files.</p>
                </div>
              </div>
              {selectedScreenshotFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Selected screenshots ({selectedScreenshotFiles.length}/{MAX_SCREENSHOTS}):</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {selectedScreenshotFiles.map((file, index) => (
                      <div key={index} className="relative group aspect-square">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Screenshot preview ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); removeScreenshotFile(index);}}
                        >
                          <XCircle className="h-4 w-4" />
                          <span className="sr-only">Remove screenshot</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FormDescription>Showcase your product with a few screenshots.</FormDescription>
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
                  <FormDescription>List the main technologies. Add each item individually by typing and pressing Enter. Max 10.</FormDescription>
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
                  <FormDescription>Help people discover your startup. Add each tag individually by typing and pressing Enter. Max 10.</FormDescription>
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
    

    

    