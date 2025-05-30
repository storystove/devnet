
"use client";

import { ProfileSetupStep2Form } from "@/components/onboarding/ProfileSetupStep2Form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProfileSetupStep2Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
    // If user is loaded and profile setup is already completed, redirect to home
    if (!authLoading && user && user.profileSetupCompleted) {
       router.replace("/");
    }
    // If user is loaded but somehow skipped step 1 (e.g. bio is missing and setup not complete), redirect to step 1
    // This logic could be more robust based on what defines "step 1 completion"
    if (!authLoading && user && !user.profileSetupCompleted && typeof user.bio === 'undefined') { 
        // router.replace("/profile-setup"); // Or check other step 1 fields
    }

  }, [user, authLoading, router]);
  
  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Additional check in case router.replace hasn't finished before render
  if (user.profileSetupCompleted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting...</p>
        <Loader2 className="ml-2 h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Almost There!</CardTitle>
        <CardDescription>Just a few more details to get you started. (Step 2 of 2)</CardDescription>
        <Progress value={100} className="mt-2 h-2" />
      </CardHeader>
      <CardContent>
        <ProfileSetupStep2Form userId={user.id || user.uid!} />
      </CardContent>
    </Card>
  );
}
