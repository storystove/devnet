import { AppLayout } from "@/components/layout/AppLayout";
import { ChatInterface } from "@/components/rooms/ChatInterface";
import type { CommunityRoom } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from 'next';

// Mock data for demonstration
const mockRoom: CommunityRoom = {
  id: "room1",
  name: "Frontend Developers Hangout",
  description: "A place for frontend devs to discuss frameworks, tools, and best practices.",
  memberCount: 125,
  topic: "Frontend Development",
};

interface RoomPageProps {
  params: { roomId: string };
}


export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  // In a real app, fetch room data here
  const room = mockRoom; // Using mock data
  return {
    title: `${room.name} | CollabForge`,
    description: `Join the conversation in ${room.name} community room.`,
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  // In a real app, you would fetch room data based on params.roomId
  const room = mockRoom; // Using mock data

  if (!room) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p>Community room not found.</p>
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
      {/* The AppLayout already provides padding, so we might not need a container here, 
          or ChatInterface should be designed to fill height. */}
      <div className="h-full"> {/* Ensure this div takes up available height */}
        <ChatInterface room={room} />
      </div>
    </AppLayout>
  );
}
