
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
import { TagInput } from "@/components/shared/TagInput";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
// import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; // Firestore directly
// import { db } from "@/lib/firebase"; // Firestore directly
import { useAuth } from "@/providers/AuthProvider"; // For updateProfile method
import type { UserProfile } from "@/types";
import { useRouter } from "next/navigation";

const parseExternalLinks = (text: string | undefined): UserProfile["externalLinks"] => {
  if (!text?.trim()) return [];
  return text.split('\\n').map(line => {
    const parts = line.split(' - ');
    return { name: parts[0]?.trim() || "", url: parts[1]?.trim() || "" };
  }).filter(link => link.name && link.url && /^https?:\/\//.test(link.url));
};

const formatExternalLinks = (links: UserProfile["externalLinks"] | undefined): string => {
  if (!links || links.length === 0) return "";
  return links.map(link => `${link.name} - ${link.url}`).join('\\n');
};

const profileStep2Schema = z.object({
  preferredLanguages: z.array(z.string()).optional(),
  externalLinksText: z.string().optional().describe("Enter links one per line: Name - URL (must be valid URLs)"),
});

type ProfileStep2FormValues = z.infer<typeof profileStep2Schema>;

interface ProfileSetupStep2FormProps {
  userId: string; // Still useful for clarity
}

export function ProfileSetupStep2Form({ userId }: ProfileSetupStep2FormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user: currentUser, updateProfile: apiUpdateProfile, loading: authLoading } = useAuth(); // Use API method
  const [isLoading, setIsLoading] = useState(false);
  // const [isFetching, setIsFetching] = useState(true); // Data comes from currentUser

  const form = useForm<ProfileStep2FormValues>({
    resolver: zodResolver(profileStep2Schema),
    defaultValues: {
      preferredLanguages: [],
      externalLinksText: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        preferredLanguages: currentUser.preferredLanguages || [],
        externalLinksText: formatExternalLinks(currentUser.externalLinks),
      });
    }
  }, [currentUser, form]);

  async function onSubmit(data: ProfileStep2FormValues) {
    setIsLoading(true);
    const externalLinks = parseExternalLinks(data.externalLinksText);
    
    if (data.externalLinksText && data.externalLinksText.trim() !== "" && externalLinks.length === 0) {
        toast({ title: "Invalid Links Format", description: "Please ensure links are 'Name - URL' and URLs are valid.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
     if (externalLinks.some(link => !link.url.startsWith('http'))) {
        toast({ title: "Invalid URL", description: "All external links must start with http:// or https://.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const updateData: Partial<UserProfile> = {
        preferredLanguages: data.preferredLanguages || [],
        externalLinks: externalLinks,
        profileSetupCompleted: true, // Mark setup as complete
      };

      const updatedUser = await apiUpdateProfile(updateData); // Call API to update
      if (updatedUser) {
        toast({ title: "Profile Setup Complete!", description: "Welcome to DevNet!" });
        router.push("/"); 
      } else {
        // Toast for failure handled by apiUpdateProfile
      }
    } catch (error: any) {
      console.error("Error updating profile (Step 2 API):", error);
      // Toast handled by apiUpdateProfile or AuthProvider
    } finally {
      setIsLoading(false);
    }
  }
  
  if (authLoading && !currentUser) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="preferredLanguages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Languages (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="e.g., English, Spanish, JavaScript"
                />
              </FormControl>
              <FormDescription>Languages you speak or code in. Press Enter to add.</FormDescription>
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
                <Textarea
                  placeholder="GitHub - https://github.com/username\nLinkedIn - https://linkedin.com/in/profile"
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>One link per line: Name - URL. Ensure URLs are valid (e.g., start with http:// or https://).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || authLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Finish Setup"}
             {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
