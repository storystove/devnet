
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
import { Loader2, ArrowRight } from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { useRouter } from "next/navigation";

const profileStep1Schema = z.object({
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
});

type ProfileStep1FormValues = z.infer<typeof profileStep1Schema>;

interface ProfileSetupStep1FormProps {
  userId: string;
}

export function ProfileSetupStep1Form({ userId }: ProfileSetupStep1FormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<ProfileStep1FormValues>({
    resolver: zodResolver(profileStep1Schema),
    defaultValues: {
      bio: "",
      skills: [],
    },
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsFetching(true);
      try {
        const userRef = doc(db, "users", userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          form.reset({
            bio: data.bio || "",
            skills: data.skills || [],
          });
        }
      } catch (error) {
        console.error("Error fetching profile data for step 1:", error);
        toast({ title: "Error", description: "Could not load existing profile data.", variant: "destructive" });
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfileData();
  }, [userId, form, toast]);

  async function onSubmit(data: ProfileStep1FormValues) {
    setIsLoading(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        bio: data.bio || "",
        skills: data.skills || [],
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Step 1 Complete!", description: "Let's move to the next step." });
      router.push("/profile-setup/step2");
    } catch (error: any) {
      console.error("Error updating profile (Step 1):", error);
      toast({ title: "Update Failed", description: error.message || "Could not save details for step 1.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell the community a bit about yourself, your interests, or what you're working on..."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Max 500 characters. You can update this later.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Top Skills (Optional)</FormLabel>
              <FormControl>
                <TagInput
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="e.g., React, Python, UI/UX Design"
                />
              </FormControl>
              <FormDescription>List skills that best represent you. Press Enter to add a skill.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Next"}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </Form>
  );
}
