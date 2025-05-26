
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UserProfile, DirectMessage as MessageType } from "@/types";
import { Send, Paperclip, ArrowLeft, Loader2 } from "lucide-react";
import { CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Removed Card, CardContent for full height layout
import { useAuth } from "@/providers/AuthProvider";
import { useState, useEffect, useRef, FormEvent, useCallback } from "react";
import { rtdb, db } from "@/lib/firebase";
import { ref, onValue, push, serverTimestamp as rtdbServerTimestamp, query, orderByChild, limitToLast, off } from "firebase/database";
import { doc, setDoc, serverTimestamp as firestoreServerTimestamp, Timestamp, getDoc } from "firebase/firestore";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";


interface DirectMessageInterfaceProps {
  chatId: string;
  currentUser: NonNullable<ReturnType<typeof useAuth>['user']>; // Ensured currentUser is not null
  otherUser: Partial<UserProfile>;
}

export function DirectMessageInterface({ chatId, currentUser, otherUser }: DirectMessageInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setIsLoadingMessages(true);
    const messagesRef = query(
      ref(rtdb, `directMessages/${chatId}/messages`),
      orderByChild('timestamp'),
      limitToLast(50) // Load last 50 messages
    );

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const fetchedMessages: MessageType[] = [];
      snapshot.forEach((childSnapshot) => {
        fetchedMessages.push({ id: childSnapshot.key!, ...childSnapshot.val() } as MessageType);
      });
      setMessages(fetchedMessages);
      setIsLoadingMessages(false);
      setTimeout(scrollToBottom, 100); // Scroll after messages are rendered
    }, (error) => {
      console.error("Error fetching messages:", error);
      setIsLoadingMessages(false);
      // Handle error display if needed
    });

    return () => off(messagesRef); // Detach listener
  }, [chatId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const updateChatMetadata = async (lastMessageText: string) => {
    const lastMessageTimestamp = firestoreServerTimestamp();

    // Update for current user
    const currentUserChatRef = doc(db, "users", currentUser.uid, "activeChats", chatId);
    await setDoc(currentUserChatRef, {
      chatId: chatId,
      otherUserId: otherUser.id,
      otherUserDisplayName: otherUser.displayName,
      otherUserAvatarUrl: otherUser.avatarUrl,
      lastMessage: lastMessageText,
      lastMessageTimestamp: lastMessageTimestamp,
      // unreadCount could be managed here if needed (e.g., increment for the other user)
    }, { merge: true });

    // Update for other user
    if (otherUser.id) {
      const otherUserChatRef = doc(db, "users", otherUser.id, "activeChats", chatId);
      const otherUserChatSnap = await getDoc(otherUserChatRef);
      const currentUnreadCount = otherUserChatSnap.exists() ? (otherUserChatSnap.data()?.unreadCount || 0) : 0;
      
      await setDoc(otherUserChatRef, {
        chatId: chatId,
        otherUserId: currentUser.uid,
        otherUserDisplayName: currentUser.displayName,
        otherUserAvatarUrl: currentUser.photoURL,
        lastMessage: lastMessageText,
        lastMessageTimestamp: lastMessageTimestamp,
        unreadCount: currentUnreadCount + 1, // Increment unread count for the recipient
      }, { merge: true });
    }
  };


  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    const messageData = {
      senderId: currentUser.uid,
      text: newMessage.trim(),
      timestamp: rtdbServerTimestamp(), // RTDB server timestamp placeholder
    };

    try {
      const messagesPath = `directMessages/${chatId}/messages`;
      await push(ref(rtdb, messagesPath), messageData);
      await updateChatMetadata(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Handle error (e.g., show toast)
    } finally {
      setIsSending(false);
    }
  };
  
  const otherUserName = otherUser.displayName || "User";
  const otherUserAvatar = otherUser.avatarUrl;
  const otherUserInitials = otherUserName?.charAt(0).toUpperCase();


  return (
    <div className="flex flex-col h-full bg-card text-card-foreground"> {/* Use full height */}
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link href="/messages"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUserAvatar || undefined} data-ai-hint="profile avatar" alt={otherUserName} />
            <AvatarFallback>{otherUserInitials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base sm:text-lg">{otherUserName}</CardTitle>
            {/* <p className="text-xs text-muted-foreground">Online</p> */}
          </div>
        </div>
        {/* Room actions (e.g., info, settings) can go here */}
      </CardHeader>
      
      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderId === currentUser.uid;
            const senderDisplayName = isOwnMessage ? "You" : otherUserName;
            const senderAvatar = isOwnMessage ? currentUser.photoURL : otherUserAvatar;
            const senderInitials = senderDisplayName?.charAt(0).toUpperCase();
            
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : ""}`}>
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={senderAvatar || undefined} data-ai-hint="profile avatar" />
                    <AvatarFallback>{senderInitials}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] p-3 rounded-xl shadow ${isOwnMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card-foreground/10 dark:bg-secondary rounded-bl-none"}`}>
                  {!isOwnMessage && <p className="text-xs font-semibold mb-0.5 text-primary">{senderDisplayName}</p>}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground/80"} ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                     {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true }) : 'Sending...'}
                  </p>
                </div>
                {isOwnMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={senderAvatar || undefined} data-ai-hint="profile avatar" />
                    <AvatarFallback>{senderInitials}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>
      
      <CardFooter className="p-3 border-t sticky bottom-0 bg-background">
        <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
          <Button variant="ghost" size="icon" type="button" disabled className="hidden sm:inline-flex">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-grow" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || isLoadingMessages}
          />
          <Button type="submit" size="icon" disabled={isSending || !newMessage.trim() || isLoadingMessages}>
            {isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </div>
  );
}
