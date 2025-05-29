
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { EditStartupForm } from "@/components/startups/EditStartupForm";
import { useAuth } from "@/providers/AuthProvider";
import type { Startup } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EditStartupPageProps {
  params: { startupId: string };
}

export default function EditStartupPage({ params: paramsFromProps }: EditStartupPageProps) {
  const params = use(paramsFromProps);
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.replace(`/signin?redirect=/startups/${params.startupId}/edit`);
      return;
    }

    const fetchStartup = async () => {
      setIsLoadingData(true);
      try {
        const startupRef = doc(db, "startups", params.startupId);
        const docSnap = await getDoc(startupRef);
        if (docSnap.exists()) {
          const fetchedStartup = { id: docSnap.id, ...docSnap.data() } as Startup;
          if (fetchedStartup.creatorId !== currentUser.uid) {
            setError("You are not authorized to edit this startup.");
            setStartup(null);
          } else {
            setStartup(fetchedStartup);
            document.title = `Edit ${fetchedStartup.name} | DevNet`;
          }
        } else {
          setError("Startup not found.");
          setStartup(null);
          document.title = "Startup Not Found | DevNet";
        }
      } catch (err) {
        console.error("Error fetching startup for edit:", err);
        setError("Failed to load startup data.");
        document.title = "Error | DevNet";
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchStartup();
  }, [params.startupId, currentUser, authLoading, router]);

  if (authLoading || isLoadingData) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-2xl py-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-2xl py-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-2 text-xl font-semibold">{error}</p>
          <Button variant="link" asChild className="mt-4">
            <Link href={startup ? `/startups/${startup.id}` : "/startups"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!startup) {
    // This case should be covered by error state, but as a fallback
    return (
      <AppLayout>
        <div className="container mx-auto max-w-2xl py-4 text-center">
          <p>Startup could not be loaded for editing.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/startups/${startup.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startup
          </Link>
        </Button>
        <EditStartupForm startup={startup} />
      </div>
    </AppLayout>
  );
}
