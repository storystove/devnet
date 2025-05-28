
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput";
import { useState, useEffect, useRef } from "react";
import { Loader2, Save, FileUp } from "lucide-react";
import type { UserProfile } from "@/types";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { updateProfile as updateAuthProfile } from "firebase/auth";
import { uploadImagePlaceholder } from "@/lib/imageUploader"; // Import the placeholder

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50),
  // avatarUrl is now optional in schema, will be populated by upload
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  externalLinksText: z.string().optional().describe("Enter links one per line: Name - URL"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const parseExternalLinks = (text: string | undefined): UserProfile["externalLinks"] => {
  if (!text?.trim()) return [];
  return text.split('\n').map(line => {
    const parts = line.split(' - ');
    return { name: parts[0]?.trim() || "", url: parts[1]?.trim() || "" };
  }).filter(link => link.name && link.url);
};

const formatExternalLinks = (links: UserProfile["externalLinks"] | undefined): string => {
  if (!links || links.length === 0) return "";
  return links.map(link => `${link.name} - ${link.url}`).join('\n');
};


export function EditProfileForm() {
  const { user: firebaseAuthUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null | undefined>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      skills: [],
      preferredLanguages: [],
      externalLinksText: "",
    },
  });

  useEffect(() => {
    if (firebaseAuthUser && !authLoading) {
      setIsFetchingProfile(true);
      const fetchProfile = async () => {
        const userRef = doc(db, "users", firebaseAuthUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          form.reset({
            displayName: profileData.displayName || firebaseAuthUser.displayName || "",
            bio: profileData.bio || "",
            skills: profileData.skills || [],
            preferredLanguages: profileData.preferredLanguages || [],
            externalLinksText: formatExternalLinks(profileData.externalLinks),
          });
          setCurrentAvatarUrl(profileData.avatarUrl || firebaseAuthUser.photoURL);
        } else {
           form.reset({
            displayName: firebaseAuthUser.displayName || "",
          });
          setCurrentAvatarUrl(firebaseAuthUser.photoURL);
          toast({ title: "Profile not found", description: "Creating a new profile entry for you.", variant: "default" });
        }
        setIsFetchingProfile(false);
      };
      fetchProfile();
    }
  }, [firebaseAuthUser, authLoading, form, toast]);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedAvatarFile(event.target.files[0]);
      // Optionally, show a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(event.target.files[0]);
    } else {
      setSelectedAvatarFile(null);
      // Revert to original avatar if file is deselected
      setCurrentAvatarUrl(firebaseAuthUser?.photoURL || (form.getValues() as any).avatarUrl);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!firebaseAuthUser) {
      toast({ title: "You must be signed in to edit your profile.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    let newAvatarUrl: string | null | undefined = currentAvatarUrl; // Keep current if no new file

    if (selectedAvatarFile) {
      try {
        newAvatarUrl = await uploadImagePlaceholder(selectedAvatarFile);
      } catch (error) {
        console.error("Placeholder avatar upload error:", error);
        toast({
          title: "Avatar Upload Failed (Placeholder)",
          description: "Could not get placeholder URL for the avatar.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const externalLinks = parseExternalLinks(data.externalLinksText);
    const profileUpdateData: Partial<UserProfile> = {
      displayName: data.displayName,
      avatarUrl: newAvatarUrl,
      bio: data.bio,
      skills: data.skills,
      preferredLanguages: data.preferredLanguages,
      externalLinks: externalLinks,
      updatedAt: serverTimestamp(),
    };

    try {
      if (auth.currentUser) {
         await updateAuthProfile(auth.currentUser, {
            displayName: data.displayName,
            photoURL: newAvatarUrl, 
        });
      }

      const userRef = doc(db, "users", firebaseAuthUser.uid);
      await updateDoc(userRef, profileUpdateData);
      
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      setSelectedAvatarFile(null); // Reset selected file
      if(avatarInputRef.current) avatarInputRef.current.value = "";
      // No need to call form.reset if we want to keep other fields populated
    } catch (error: any) {
        console.error("Error updating profile:", error);
        toast({ title: "Update Failed", description: error.message || "Could not save profile.", variant: "destructive"})
    } finally {
        setIsLoading(false);
    }
  }

  if (authLoading || isFetchingProfile) {
      return <Card className="shadow-lg"><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></CardContent></Card>
  }

  if (!firebaseAuthUser) {
      return <Card className="shadow-lg"><CardContent className="p-6 text-center text-muted-foreground">Please sign in to edit your profile.</CardContent></Card>
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
            
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-muted-foreground" /> Avatar (Optional)
              </FormLabel>
              <div className="flex items-center gap-4">
                {currentAvatarUrl && (
                  <img src={currentAvatarUrl} alt="Avatar preview" className="h-20 w-20 rounded-full object-cover border" data-ai-hint="profile avatar current"/>
                )}
                 {!currentAvatarUrl && (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-2xl border">
                    {form.getValues().displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <FormControl>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarFileChange}
                    ref={avatarInputRef}
                    className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </FormControl>
              </div>
               {selectedAvatarFile && (
                <FormDescription className="text-xs mt-1">
                  New: {selectedAvatarFile.name} ({(selectedAvatarFile.size / 1024).toFixed(2)} KB)
                </FormDescription>
              )}
            </FormItem>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us a bit about yourself..." className="min-h-[100px]" {...field} value={field.value || ''} />
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
                    <Textarea placeholder="GitHub - https://github.com/username&#10;LinkedIn - https://linkedin.com/in/profile" className="min-h-[80px]" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormDescription>Enter one link per line in the format: Name - URL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isFetchingProfile}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
