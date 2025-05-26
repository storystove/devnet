"use client"; // This page needs client-side hooks for auth state

import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileDisplay } from "@/components/profile/ProfileDisplay";
import type { UserProfile } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const mockUserProfile: UserProfile = {
  id: "user123",
  displayName: "Alice W.",
  email: "alice@example.com",
  avatarUrl: "https://placehold.co/200x200.png",
  bio: "Full-stack developer passionate about creating intuitive user experiences and exploring new technologies. Currently diving deep into AI and Web3. Always open to collaboration on exciting projects!",
  skills: ["JavaScript", "React", "Node.js", "Python", "AI/ML", "Solidity"],
  preferredLanguages: ["English", "Spanish"],
  externalLinks: [
    { name: "GitHub", url: "https://github.com" },
    { name: "LinkedIn", url: "https://linkedin.com" },
    { name: "Personal Portfolio", url: "https://example.com" },
  ],
  followerCount: 150,
  followingCount: 75,
  joinedStartups: ["startup1", "startup3"],
};


interface ProfilePageProps {
  params: { userId: string };
}

// Since metadata cannot be dynamic with "use client", we'll set a generic one in layout or keep it simple.
// export const metadata: Metadata = {
//   title: 'User Profile | CollabForge',
// };

export default function ProfilePage({ params }: ProfilePageProps) {
  const { user: currentUser, loading: authLoading } = useAuth();
  
  // In a real app, you would fetch profile data based on params.userId
  // For now, we use mock data. If params.userId matches current user, show current user's mock.
  const profileData = params.userId === currentUser?.uid ? { ...mockUserProfile, ...currentUser, id: currentUser.uid } : { ...mockUserProfile, id: params.userId };
  const isLoadingProfile = false; // Replace with actual profile loading state

  if (authLoading || isLoadingProfile) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-3xl py-8">
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!profileData) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p>User profile not found.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-4">
         <Button variant="ghost" asChild className="mb-6">
          <Link href="/"> {/* Or back to previous page */}
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <ProfileDisplay profile={profileData} isCurrentUser={currentUser?.uid === params.userId} />
      </div>
    </AppLayout>
  );
}
