
"use client";

import { ProfileSetupStep1Form } from "@/components/onboarding/ProfileSetupStep1Form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function ProfileSetupStep1Page() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
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
        <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
        <CardDescription>Tell us a bit more about yourself. (Step 1 of 2)</CardDescription>
        <Progress value={50} className="mt-2 h-2" />
      </CardHeader>
      <CardContent>
        <ProfileSetupStep1Form userId={user.uid} />
      </CardContent>
    </Card>
  );
}
