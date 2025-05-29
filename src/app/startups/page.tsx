
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { StartupCard } from "@/components/startups/StartupCard";
import { Button } from "@/components/ui/button";
import type { Startup } from "@/types";
import Link from "next/link";
import { PlusCircle, Rocket, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStartups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const startupsRef = collection(db, "startups");
        const q = query(startupsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedStartups = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            // Ensure createdAt is correctly typed for StartupCard.
            // It should already be a Timestamp if fetched from Firestore.
            createdAt: data.createdAt as Timestamp 
          } as Startup;
        });
        setStartups(fetchedStartups);
      } catch (err: any) {
        console.error("Error fetching startups:", err);
        setError("Failed to load startups. Please try again later.");
        toast({
          title: "Error",
          description: "Could not fetch startups.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStartups();
  }, [toast]);

  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Startup Showcase</h1>
          <Button asChild>
            <Link href="/startups/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Startup
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && error && (
          <div className="text-center py-10 text-destructive">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && startups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
        
        {!isLoading && !error && startups.length === 0 && (
           <div className="text-center py-10">
            <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Startups Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to showcase your startup!
            </p>
            <Button asChild className="mt-4">
                <Link href="/startups/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Your Startup
                </Link>
            </Button>
           </div>
        )}
      </div>
    </AppLayout>
  );
}
