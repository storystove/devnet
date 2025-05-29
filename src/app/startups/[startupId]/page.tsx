
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StartupDetails } from "@/components/startups/StartupDetails";
import type { Startup } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use, useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface StartupPageProps {
  params: { startupId: string };
}

// Metadata might be limited if page is client-rendered for data
// export async function generateMetadata({ params }: StartupPageProps): Promise<Metadata> {
//   // In a real app, fetch startup data here
//   // const startup = await fetchStartupData(params.startupId);
//   // return {
//   //   title: `${startup?.name || 'Startup'} | DevNet`,
//   //   description: startup?.description.substring(0,160) || "View startup details on DevNet",
//   // };
//   return { title: "Startup | DevNet" }
// }


export default function StartupPage({ params: paramsFromProps }: StartupPageProps) {
  const params = use(paramsFromProps); // Unwrap promise for params
  const { toast } = useToast();
  
  const [startup, setStartup] = useState<Startup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.startupId) {
      setIsLoading(true);
      const fetchStartup = async () => {
        try {
          const startupRef = doc(db, "startups", params.startupId);
          const docSnap = await getDoc(startupRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
             setStartup({ 
              id: docSnap.id, 
              ...data,
              createdAt: data.createdAt as Timestamp // Ensure correct type
            } as Startup);
          } else {
            toast({ title: "Startup not found", description: "This startup does not exist or was removed.", variant: "destructive" });
            setStartup(null);
          }
        } catch (error) {
          console.error("Error fetching startup:", error);
          toast({ title: "Error", description: "Could not fetch startup details.", variant: "destructive" });
          setStartup(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchStartup();
    }
  }, [params.startupId, toast]);

  useEffect(() => {
    if (startup?.name) {
      document.title = `${startup.name} | DevNet`;
    } else if (!isLoading && !startup) {
      document.title = "Startup Not Found | DevNet";
    } else {
      document.title = "Startup | DevNet";
    }
  }, [startup, isLoading]);


  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto max-w-4xl py-8 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!startup) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p className="text-xl text-muted-foreground">Startup not found.</p>
           <Button variant="link" asChild className="mt-4">
            <Link href="/startups">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Startups
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/startups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startups
          </Link>
        </Button>
        <StartupDetails startup={startup} />
      </div>
    </AppLayout>
  );
}
