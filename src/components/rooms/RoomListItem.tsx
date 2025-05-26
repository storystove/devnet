"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunityRoom } from "@/types";
import { Users, MessageSquare, ArrowRight } from "lucide-react";

interface RoomListItemProps {
  room: CommunityRoom;
}

export function RoomListItem({ room }: RoomListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg hover:text-primary">
              <Link href={`/rooms/${room.id}`}>{room.name}</Link>
            </CardTitle>
            {room.topic && <Badge variant="outline" className="mt-1 text-xs">{room.topic}</Badge>}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            {room.memberCount}
          </div>
        </div>
      </CardHeader>
      {room.description && (
        <CardContent className="pb-4">
          <CardDescription className="text-sm line-clamp-2">{room.description}</CardDescription>
        </CardContent>
      )}
      <CardContent className="pt-0 pb-4 flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/rooms/${room.id}`}>
            Join Room <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
