
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput";
import { useState, useRef } from "react";
import { Image as ImageIcon, Code, Send, Loader2, FileUp } from "lucide-react";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Post } from "@/types";
import { uploadImagePlaceholder } from "@/lib/imageUploader"; // Import the placeholder

const postFormSchema = z.object({
  text: z.string().min(1, "Post content cannot be empty.").max(1000, "Post content is too long."),
  // Image URL is now optional in schema, will be populated by upload
  tags: z.array(z.string()).optional(),
  codeSnippetLanguage: z.string().optional(),
  codeSnippetCode: z.string().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

interface CreatePostFormProps {
  onPostCreated?: (newPost: Post) => void;
}

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      text: "",
      tags: [],
      codeSnippetLanguage: "",
      codeSnippetCode: "",
    },
  });

  const textContent = form.watch("text");

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedImageFile(event.target.files[0]);
    } else {
      setSelectedImageFile(null);
    }
  };

  async function onSubmit(data: PostFormValues) {
    if (!user) {
      toast({ title: "Please sign in to post.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    let imageUrl: string | null = null;
    if (selectedImageFile) {
      try {
        // Using the placeholder uploader
        imageUrl = await uploadImagePlaceholder(selectedImageFile);
      } catch (error) {
        console.error("Placeholder image upload error:", error);
        toast({
          title: "Image Upload Failed (Placeholder)",
          description: "Could not get placeholder URL for the image.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const postDataPayload: Omit<Post, "id" | "createdAt"> & { createdAt: any } = { 
        authorId: user.uid,
        authorDisplayName: user.displayName || "Anonymous",
        authorAvatarUrl: user.photoURL || null,
        text: data.text,
        hashtags: data.tags || [],
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      };

      if (imageUrl) {
        postDataPayload.imageUrl = imageUrl;
      }

      if (data.codeSnippetCode && data.codeSnippetCode.trim() !== "" && data.codeSnippetLanguage && data.codeSnippetLanguage.trim() !== "") {
        postDataPayload.codeSnippet = { 
          code: data.codeSnippetCode, 
          language: data.codeSnippetLanguage 
        };
      }

      const docRef = await addDoc(collection(db, "posts"), postDataPayload);
      
      toast({ title: "Post created!", description: "Your post is now live." });
      if (onPostCreated) {
        const createdPost: Post = {
          id: docRef.id,
          ...postDataPayload,
          imageUrl: postDataPayload.imageUrl || null,
          createdAt: Timestamp.now(), // Use client-side timestamp for optimistic UI update
        };
        onPostCreated(createdPost);
      }
      form.reset();
      setSelectedImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = ""; // Reset file input
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Post Creation Failed",
        description: error.message || "Could not save your post.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle>Create a New Post</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What's on your mind?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, ideas, or updates..."
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" /> Upload Image (Optional)
              </FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageFileChange} 
                  ref={imageInputRef}
                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              </FormControl>
              {selectedImageFile && (
                <FormDescription className="text-xs">
                  Selected: {selectedImageFile.name} ({(selectedImageFile.size / 1024).toFixed(2)} KB)
                </FormDescription>
              )}
            </FormItem>
            
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" /> Code Snippet (Optional)
              </FormLabel>
              <FormControl>
                <div className="space-y-2">
                   <Input placeholder="Language (e.g., javascript)" {...form.register("codeSnippetLanguage")} />
                   <Textarea placeholder="Your code here..." className="min-h-[80px] font-mono text-sm" {...form.register("codeSnippetCode")} />
                </div>
              </FormControl>
              <FormDescription>Share a piece of code with the community.</FormDescription>
            </FormItem>

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
                        placeholder="Add relevant tags..."
                        contentForSuggestions={textContent}
                      />
                  </FormControl>
                  <FormDescription>Help others discover your post.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !user}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {user ? "Create Post" : "Sign in to Post"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
