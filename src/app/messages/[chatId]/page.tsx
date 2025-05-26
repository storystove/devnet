
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { DirectMessageInterface } from "@/components/dms/DirectMessageInterface";
import { useAuth } from "@/providers/AuthProvider";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { useRouter } from "next/navigation"; // Import useRouter

interface DirectMessagePageProps {
  params: { chatId: string };
}

export default function DirectMessagePage({ params }: DirectMessagePageProps) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter(); // Initialize useRouter
  const { chatId } = params;

  const [otherUser, setOtherUser] = useState<Partial<UserProfile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push("/signin"); // Redirect if not authenticated
      return;
    }

    const fetchOtherUserDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const participantIds = chatId.split('_');
        const otherUserId = participantIds.find(id => id !== currentUser.uid);

        if (!otherUserId) {
          setError("Invalid chat. Could not determine the other participant.");
          setIsLoading(false);
          return;
        }

        const userRef = doc(db, "users", otherUserId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setOtherUser({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setError("Could not find the user you are trying to message.");
        }
      } catch (err) {
        console.error("Error fetching other user details:", err);
        setError("Failed to load chat details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOtherUserDetails();
  }, [chatId, currentUser, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col h-[calc(100vh-var(--header-height,100px)-2rem)] md:h-[calc(100vh-var(--header-height,100px)-3rem)] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-2 text-xl font-semibold">{error}</p>
          <Button variant="link" asChild className="mt-4">
            <Link href="/messages">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }
  
  if (!currentUser) {
     // This case should ideally be caught by the redirect, but as a fallback:
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p>Please sign in to view messages.</p>
        </div>
      </AppLayout>
    );
  }

  if (!otherUser) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p>Could not load user information for this chat.</p>
           <Button variant="link" asChild className="mt-4">
            <Link href="/messages">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Messages
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }


  return (
    <AppLayout>
      <div className="h-full"> {/* Ensure this div takes up available height */}
        <DirectMessageInterface chatId={chatId} currentUser={currentUser} otherUser={otherUser} />
      </div>
    </AppLayout>
  );
}
