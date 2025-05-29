
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/rooms/ChatInterface";
import type { CommunityRoom } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use, useEffect, useState } from 'react';
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface RoomPageProps {
  params: { roomId: string };
}

// Metadata might be limited if page is client-rendered for data
// export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
//   // Fetch room data for metadata
//   return { title: "Community Room | DevNet" };
// }

export default function RoomPage({ params: paramsFromProps }: RoomPageProps) {
  const params = use(paramsFromProps); // Unwrap promise for params
  const { toast } = useToast();
  const [room, setRoom] = useState<CommunityRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.roomId) {
      setIsLoading(true);
      const fetchRoom = async () => {
        try {
          const roomRef = doc(db, "communityRooms", params.roomId);
          const docSnap = await getDoc(roomRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRoom({ 
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt as Timestamp // Ensure correct type
            } as CommunityRoom);
          } else {
            toast({ title: "Room not found", description: "This room does not exist or was removed.", variant: "destructive" });
            setRoom(null);
          }
        } catch (error) {
          console.error("Error fetching room:", error);
          toast({ title: "Error", description: "Could not fetch room details.", variant: "destructive" });
          setRoom(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoom();
    }
  }, [params.roomId, toast]);

  useEffect(() => {
    if (room?.name) {
      document.title = `${room.name} | DevNet`;
    } else if (!isLoading && !room) {
      document.title = "Room Not Found | DevNet";
    } else {
      document.title = "Community Room | DevNet";
    }
  }, [room, isLoading]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 flex justify-center items-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!room) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p className="text-xl text-muted-foreground">Community room not found.</p>
          <Button variant="link" asChild className="mt-4">
            <Link href="/rooms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Rooms
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-full"> {/* ChatInterface should handle its own height */}
        <ChatInterface room={room} />
      </div>
    </AppLayout>
  );
}
