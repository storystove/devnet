
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { RoomListItem } from "@/components/rooms/RoomListItem";
import { Button } from "@/components/ui/button";
import type { CommunityRoom } from "@/types";
import Link from "next/link";
import { PlusCircle, MessageSquare as MessageSquareIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


export default function RoomsPage() {
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Community Rooms | DevNet";
    const fetchRooms = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const roomsRef = collection(db, "communityRooms");
        const q = query(roomsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedRooms = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id,
            ...data,
            createdAt: data.createdAt as Timestamp // Ensure correct type for RoomListItem
          } as CommunityRoom;
        });
        setRooms(fetchedRooms);
      } catch (err: any) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load community rooms. Please try again later.");
        toast({
          title: "Error",
          description: "Could not fetch community rooms.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, [toast]);

  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Community Rooms</h1>
          <Button asChild>
            <Link href="/rooms/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Room
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

        {!isLoading && !error && rooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <RoomListItem key={room.id} room={room} />
            ))}
          </div>
        )}

        {!isLoading && !error && rooms.length === 0 && (
           <div className="text-center py-10">
            <MessageSquareIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Rooms Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a new community room and invite others to join!
            </p>
            <Button asChild className="mt-4">
                <Link href="/rooms/create">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Room
                </Link>
            </Button>
           </div>
        )}
      </div>
    </AppLayout>
  );
}
