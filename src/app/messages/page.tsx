
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import type { UserProfile } from "@/types";
import Link from "next/link";
import { MessagesSquare as MessagesSquareIcon, Loader2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge"; // Added missing import

// Correctly define ActiveChat type
type ActiveChat = NonNullable<UserProfile['activeChats']>[number];

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoadingChats(false);
      // Optionally redirect or show a message to sign in
      return;
    }

    setIsLoadingChats(true);
    const userChatsRef = collection(db, "users", user.uid, "activeChats");
    const q = query(userChatsRef, orderBy("lastMessageTimestamp", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const chats: ActiveChat[] = [];
        querySnapshot.forEach((doc) => {
          chats.push(doc.data() as ActiveChat);
        });
        setActiveChats(chats);
        setIsLoadingChats(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching active chats:", err);
        setError("Could not load your conversations. Please try again later.");
        setIsLoadingChats(false);
      }
    );

    return () => unsubscribe();

  }, [user, authLoading]);

  if (authLoading || isLoadingChats) {
    return (
      <AppLayout>
        <div className="container mx-auto py-4">
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
     return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-2 text-xl font-semibold">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Please sign in to view your messages.
          </p>
          <Button asChild className="mt-4">
            <Link href="/signin">Sign In</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Your Messages</h1>
          {/* Placeholder for "New Message" button if needed */}
        </div>

        {error && (
          <Card className="mb-4 bg-destructive/10 border-destructive">
            <CardContent className="p-4 text-destructive">
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {activeChats.length > 0 ? (
          <div className="space-y-3">
            {activeChats.map((chat) => (
              <Link key={chat.chatId} href={`/messages/${chat.chatId}`} passHref>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.otherUserAvatarUrl || undefined} alt={chat.otherUserDisplayName || 'User'} data-ai-hint="profile avatar" />
                      <AvatarFallback>{chat.otherUserDisplayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-semibold truncate">{chat.otherUserDisplayName || "Unknown User"}</p>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || "No messages yet..."}</p>
                    </div>
                    <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                      {chat.lastMessageTimestamp && formatDistanceToNow((chat.lastMessageTimestamp as Timestamp).toDate(), { addSuffix: true })}
                      {chat.unreadCount && chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2 mt-1">{chat.unreadCount}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
           <div className="text-center py-10">
            <MessagesSquareIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Conversations Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a new conversation by messaging a user from their profile.
            </p>
           </div>
        )}
      </div>
    </AppLayout>
  );
}
