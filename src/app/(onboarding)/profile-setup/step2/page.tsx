
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
    // Optionally, redirect if profileSetupCompleted is true and user lands here directly
    // if (!authLoading && user && user.profileSetupCompleted) {
    //   router.replace("/");
    // }
  }, [user, authLoading, router]);
  
  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        <ProfileSetupStep2Form userId={user.uid} />
      </CardContent>
    </Card>
  );
}
