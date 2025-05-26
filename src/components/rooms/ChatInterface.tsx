"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CommunityRoom } from "@/types";
import { Send, Paperclip, Pin, Users, Settings } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ChatMessage {
  id: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: Date;
  isOwnMessage?: boolean;
}

// Mock messages for demonstration
const mockMessages: ChatMessage[] = [
  { id: "1", senderName: "Alice", text: "Hey everyone! Welcome to the room.", timestamp: new Date(Date.now() - 1000 * 60 * 5), senderAvatar: "https://placehold.co/40x40.png?text=A" },
  { id: "2", senderName: "Bob", text: "Hi Alice! Glad to be here.", timestamp: new Date(Date.now() - 1000 * 60 * 4), isOwnMessage: true, senderAvatar: "https://placehold.co/40x40.png?text=B" },
  { id: "3", senderName: "Charlie", text: "What's the main topic for today?", timestamp: new Date(Date.now() - 1000 * 60 * 3), senderAvatar: "https://placehold.co/40x40.png?text=C" },
  { id: "4", senderName: "Alice", text: "We can discuss the new JS framework that just dropped!", timestamp: new Date(Date.now() - 1000 * 60 * 2), senderAvatar: "https://placehold.co/40x40.png?text=A" },
  { id: "5", senderName: "Bob", text: "Sounds interesting! I've heard good things about it.", timestamp: new Date(Date.now() - 1000 * 60 * 1), isOwnMessage: true, senderAvatar: "https://placehold.co/40x40.png?text=B" },
];


interface ChatInterfaceProps {
  room: CommunityRoom;
}

export function ChatInterface({ room }: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,100px)-2rem)] md:h-[calc(100vh-var(--header-height,100px)-3rem)]">
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div>
          <CardTitle className="text-xl">{room.name}</CardTitle>
          <p className="text-sm text-muted-foreground flex items-center">
            <Users className="mr-1.5 h-4 w-4" /> {room.memberCount} members
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" disabled>
                <Pin className="h-5 w-5" />
                <span className="sr-only">Pinned Messages</span>
            </Button>
            <Button variant="ghost" size="icon" disabled>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Room Settings</span>
            </Button>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-grow p-4 space-y-4 bg-muted/20">
        {mockMessages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.isOwnMessage ? "justify-end" : ""}`}>
            {!msg.isOwnMessage && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={msg.senderAvatar} data-ai-hint="profile avatar" />
                <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[70%] p-3 rounded-xl shadow ${msg.isOwnMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background rounded-bl-none"}`}>
              {!msg.isOwnMessage && <p className="text-xs font-semibold mb-0.5">{msg.senderName}</p>}
              <p className="text-sm">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground/70"} text-right`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.isOwnMessage && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={msg.senderAvatar} data-ai-hint="profile avatar" />
                <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </ScrollArea>
      
      <CardFooter className="p-4 border-t">
        <form className="flex w-full items-center gap-2">
          <Button variant="ghost" size="icon" type="button" disabled>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input type="text" placeholder="Type a message..." className="flex-grow" />
          <Button type="submit" size="icon" disabled>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </div>
  );
}
