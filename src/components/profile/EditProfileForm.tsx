
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
import { Card, CardContent, CardDescription as ShadCNCardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider"; // Use new AuthProvider
import { useToast } from "@/hooks/use-toast";
import { TagInput } from "@/components/shared/TagInput";
import { useState, useEffect, useRef } from "react";
import { Loader2, Save, FileUp, Palette } from "lucide-react";
import type { UserProfile } from "@/types";
// Firebase imports removed
// import { updateProfile as updateAuthProfile } from "firebase/auth"; // Firebase Auth specific
// import { uploadImagePlaceholder } from "@/lib/imageUploader"; // No longer using this generic one for avatars
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/providers/ThemeProvider";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  externalLinksText: z.string().optional().describe("Enter links one per line: Name - URL"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

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


export function EditProfileForm() {
  const { user: currentUser, loading: authLoading, updateProfile, uploadAvatar, fetchCurrentUser } = useAuth(); // Use new AuthProvider methods
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true); // Renamed from firebaseAuthUser
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
    if (currentUser && !authLoading) {
      setIsFetchingProfile(true);
      // User data now comes from AuthProvider's user state, which is fetched from API
      form.reset({
        displayName: currentUser.displayName || "",
        bio: currentUser.bio || "",
        skills: currentUser.skills || [],
        preferredLanguages: currentUser.preferredLanguages || [],
        externalLinksText: formatExternalLinks(currentUser.externalLinks),
      });
      setCurrentAvatarUrl(currentUser.avatarUrl || currentUser.photoURL); // photoURL for compatibility
      setIsFetchingProfile(false);
    } else if (!currentUser && !authLoading) {
      // Handle case where user is not logged in but tries to access edit page (should be protected by layout/router)
      setIsFetchingProfile(false);
       toast({ title: "Not Authenticated", description: "Please sign in to edit your profile.", variant: "destructive" });
    }
  }, [currentUser, authLoading, form, toast]);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentAvatarUrl(reader.result as string); // Show local preview
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedAvatarFile(null);
      setCurrentAvatarUrl(currentUser?.avatarUrl || currentUser?.photoURL); // Revert to original
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!currentUser) {
      toast({ title: "You must be signed in to edit your profile.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    let newAvatarUploadedUrl: string | undefined = undefined;

    if (selectedAvatarFile) {
      try {
        const uploadResponse = await uploadAvatar(selectedAvatarFile); // Use new uploadAvatar method
        if (uploadResponse?.avatarUrl) {
          newAvatarUploadedUrl = uploadResponse.avatarUrl;
        } else {
          // Avatar upload failed, but toast is shown by uploadAvatar.
          // Decide if you want to proceed with other profile updates or stop.
          // For now, we'll let profile update attempt without new avatar if upload failed.
        }
      } catch (error: any) {
        // Error already toasted by uploadAvatar
        setIsLoading(false);
        return; // Stop if avatar upload itself threw a critical error
      }
    }

    const externalLinks = parseExternalLinks(data.externalLinksText);
    // Validate parsed links (basic check)
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

    const profileUpdateData: Partial<UserProfile> = {
      displayName: data.displayName,
      bio: data.bio,
      skills: data.skills,
      preferredLanguages: data.preferredLanguages,
      externalLinks: externalLinks,
      // avatarUrl will be updated if newAvatarUploadedUrl is set
    };
    
    if (newAvatarUploadedUrl) {
        profileUpdateData.avatarUrl = newAvatarUploadedUrl;
    }


    try {
      await updateProfile(profileUpdateData); // Use new updateProfile method
      // Toast for success is handled by updateProfile method
      setSelectedAvatarFile(null); 
      if(avatarInputRef.current) avatarInputRef.current.value = "";
      // Optionally re-fetch current user to ensure local state is perfectly in sync
      // await fetchCurrentUser(); // AuthProvider might already do this if updateProfile updates its internal user
    } catch (error: any) {
        // Error already toasted by updateProfile
        console.error("Error in onSubmit after calling updateProfile:", error);
    } finally {
        setIsLoading(false);
    }
  }

  if (authLoading || isFetchingProfile) {
      return <Card className="shadow-lg"><CardContent className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></CardContent></Card>;
  }

  if (!currentUser) { // Should be caught by layout, but as a safeguard
      return <Card className="shadow-lg"><CardContent className="p-6 text-center text-muted-foreground">Please sign in to edit your profile.</CardContent></Card>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Edit Your Profile</CardTitle>
        <ShadCNCardDescription>Keep your DevNet profile up-to-date.</ShadCNCardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <div className="space-y-6">
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
                            <Textarea placeholder="GitHub - https://github.com/username\nLinkedIn - https://linkedin.com/in/profile" className="min-h-[80px]" {...field} value={field.value || ''}/>
                        </FormControl>
                        <FormDescription>Enter one link per line in the format: Name - URL</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                    <Palette className="mr-2 h-5 w-5" /> Appearance
                </h3>
                <FormItem className="space-y-3">
                    <FormLabel>Theme</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={(value: string) => setTheme(value as "light" | "dark" | "system")}
                        defaultValue={theme}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="light" />
                            </FormControl>
                            <FormLabel className="font-normal">Light</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="dark" />
                            </FormControl>
                            <FormLabel className="font-normal">Dark</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="system" />
                            </FormControl>
                            <FormLabel className="font-normal">System</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormDescription>Select your preferred theme for the application.</FormDescription>
                </FormItem>
            </div>
            
            <Separator />

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || authLoading || isFetchingProfile}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
