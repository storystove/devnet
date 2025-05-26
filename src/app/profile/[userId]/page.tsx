
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileDisplay } from "@/components/profile/ProfileDisplay";
import type { UserProfile } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use, useEffect, useState } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface ProfilePageProps {
  params: { userId: string };
}

export default function ProfilePage({ params: paramsFromProps }: ProfilePageProps) {
  const params = use(paramsFromProps); // Unwrap promise for params
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (params.userId) {
      setIsLoadingProfile(true);
      const fetchProfile = async () => {
        try {
          const userRef = doc(db, "users", params.userId);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setProfileData({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            toast({ title: "Profile not found", description: "This user profile does not exist.", variant: "destructive" });
            setProfileData(null);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          toast({ title: "Error", description: "Could not fetch user profile.", variant: "destructive" });
          setProfileData(null);
        } finally {
          setIsLoadingProfile(false);
        }
      };
      fetchProfile();
    }
  }, [params.userId, toast]);

  if (authLoading || isLoadingProfile) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-3xl py-8">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p className="text-xl text-muted-foreground">User profile not found.</p>
          <Button variant="link" asChild className="mt-4">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Feed
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-4">
         <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <ProfileDisplay profile={profileData} isCurrentUser={currentUser?.uid === params.userId} />
      </div>
    </AppLayout>
  );
}
