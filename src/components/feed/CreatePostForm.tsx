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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput";
import { useState } from "react";
import { Image as ImageIcon, Code, Send, Loader2 } from "lucide-react";

const postFormSchema = z.object({
  text: z.string().min(1, "Post content cannot be empty.").max(1000, "Post content is too long."),
  imageUrl: z.string().url("Invalid image URL.").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  codeSnippetLanguage: z.string().optional(),
  codeSnippetCode: z.string().optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export function CreatePostForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      text: "",
      imageUrl: "",
      tags: [],
      codeSnippetLanguage: "",
      codeSnippetCode: "",
    },
  });

  const textContent = form.watch("text"); // For tag suggestions

  async function onSubmit(data: PostFormValues) {
    if (!user) {
      toast({ title: "Please sign in to post.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    console.log("Creating post:", data);
    // TODO: Implement actual post creation logic (e.g., save to Firestore)
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    toast({ title: "Post created!", description: "Your post is now live." });
    form.reset();
    setIsLoading(false);
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

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" /> Image URL (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Placeholder for Code Snippet */}
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
