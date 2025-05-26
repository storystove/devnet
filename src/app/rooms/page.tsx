import { AppLayout } from "@/components/layout/AppLayout";
import { RoomListItem } from "@/components/rooms/RoomListItem";
import { Button } from "@/components/ui/button";
import type { CommunityRoom } from "@/types";
import Link from "next/link";
import { PlusCircle, MessageSquare as MessageSquareIcon } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Rooms | CollabForge',
  description: 'Join discussions and collaborate in community rooms on CollabForge.',
};

// Mock data for demonstration
const mockRooms: CommunityRoom[] = [
  {
    id: "room1",
    name: "Frontend Developers Hangout",
    description: "A place for frontend devs to discuss frameworks, tools, and best practices. Share your projects and get feedback!",
    memberCount: 125,
    topic: "Frontend Development",
  },
  {
    id: "room2",
    name: "AI & Machine Learning Enthusiasts",
    description: "Discuss the latest advancements in AI/ML, share research papers, and collaborate on projects.",
    memberCount: 230,
    topic: "AI/ML",
  },
  {
    id: "room3",
    name: "Startup Founders Hub",
    description: "Connect with fellow startup founders, share challenges, and find co-founders or mentors.",
    memberCount: 88,
    topic: "Startups & Entrepreneurship",
  },
  {
    id: "room4",
    name: "Open Source Contributors",
    description: "Find open source projects to contribute to, or showcase your own projects seeking contributors.",
    memberCount: 150,
    topic: "Open Source",
  },
];

export default function RoomsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Community Rooms</h1>
          <Button disabled> {/* Placeholder for Create Room */}
            <PlusCircle className="mr-2 h-4 w-4" /> Create Room
          </Button>
        </div>

        {mockRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRooms.map((room) => (
              <RoomListItem key={room.id} room={room} />
            ))}
          </div>
        ) : (
           <div className="text-center py-10">
            <MessageSquareIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Rooms Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a new community room and invite others to join!
            </p>
            <Button disabled className="mt-4"> {/* Placeholder for Create Room */}
                <PlusCircle className="mr-2 h-4 w-4" /> Create Room
            </Button>
           </div>
        )}
      </div>
    </AppLayout>
  );
}
