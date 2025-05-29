
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { CreateRoomForm } from "@/components/rooms/CreateRoomForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// No static metadata needed for a client-side form page usually
// export const metadata: Metadata = {
//   title: 'Create Community Room | DevNet',
//   description: 'Start a new discussion room on DevNet.',
// };

export default function CreateRoomPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin?redirect=/rooms/create");
    }
  }, [user, loading, router]);

  useEffect(() => {
    document.title = "Create Room | DevNet";
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-2xl py-4 text-center">Loading...</div>
      </AppLayout>
    );
  }

  if (!user) {
     return (
      <AppLayout>
        <div className="container mx-auto max-w-2xl py-4 text-center">Redirecting to sign in...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/rooms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Link>
        </Button>
        <CreateRoomForm />
      </div>
    </AppLayout>
  );
}
