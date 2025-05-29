
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { CommunityRoom } from "@/types";

const roomFormSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters.").max(60, "Room name is too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500, "Description is too long.").optional().or(z.literal("")),
  topic: z.string().min(2, "Topic must be at least 2 characters.").max(30, "Topic is too long."),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export function CreateRoomForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      description: "",
      topic: "",
    },
  });

  async function onSubmit(data: RoomFormValues) {
    if (!user) {
      toast({ title: "Please sign in to create a room.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    
    const roomData: Omit<CommunityRoom, "id" | "createdAt"> & { createdAt: any } = {
      name: data.name,
      description: data.description || "",
      topic: data.topic,
      creatorId: user.uid,
      creatorDisplayName: user.displayName || user.email,
      creatorAvatarUrl: user.photoURL || null,
      memberCount: 1, // Creator is the first member
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "communityRooms"), roomData);
      toast({ title: "Room created!", description: `The room "${data.name}" is now open.` });
      form.reset();
      router.push(`/rooms/${docRef.id}`); // Redirect to the new room's page
    } catch (error: any) {
      console.error("Error creating room:", error);
      toast({
        title: "Room Creation Failed",
        description: error.message || "Could not create the room.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Create a New Community Room</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Frontend Developers Hangout" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this room about?"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic / Main Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., React, AI, Startups" {...field} />
                  </FormControl>
                  <FormDescription>A short keyword to categorize the room.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !user}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
              {user ? "Create Room" : "Sign in to Create"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
