"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Startup, UserProfile } from "@/types"; // Assuming UserProfile type exists
import { Users, Tag, Layers, CalendarDays, MessageSquare, UserPlus, Heart, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface StartupDetailsProps {
  startup: Startup;
  coFounders?: Partial<UserProfile>[]; // Optional: Pass co-founder profiles
}

// Mock co-founder for display
const mockCoFounders: Partial<UserProfile>[] = [
    { id: 'user1', displayName: 'Jane Doe', avatarUrl: 'https://placehold.co/80x80.png' },
    { id: 'user2', displayName: 'John Smith', avatarUrl: 'https://placehold.co/80x80.png' }
];


export function StartupDetails({ startup, coFounders = mockCoFounders }: StartupDetailsProps) {
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="bg-muted/30 p-6 border-b">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {startup.logoUrl ? (
              <Image
                src={startup.logoUrl}
                alt={`${startup.name} logo`}
                width={100}
                height={100}
                className="rounded-lg border-2 border-background shadow-md"
                data-ai-hint="company logo large"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted text-muted-foreground text-3xl font-semibold">
                {startup.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold mb-1">{startup.name}</CardTitle>
              <Badge variant="secondary" className="capitalize text-sm py-1 px-2">{startup.status}</Badge>
              <p className="text-sm text-muted-foreground mt-2 flex items-center">
                <CalendarDays className="mr-2 h-4 w-4" />
                Launched: {startup.createdAt ? format(new Date(startup.createdAt), "MMMM d, yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardDescription className="text-base leading-relaxed mb-6">{startup.description}</CardDescription>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Layers className="mr-2 h-5 w-5 text-primary" />Tech Stack</h3>
              {startup.techStack && startup.techStack.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {startup.techStack.map((tech) => (
                    <Badge key={tech} variant="outline">{tech}</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Not specified.</p>}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center"><Tag className="mr-2 h-5 w-5 text-primary" />Tags</h3>
              {startup.tags && startup.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {startup.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No tags yet.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Co-Founders</h3>
            {coFounders && coFounders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coFounders.map((founder) => (
                  <Card key={founder.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={founder.avatarUrl || undefined} alt={founder.displayName || "Founder"} data-ai-hint="profile avatar" />
                        <AvatarFallback>{founder.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{founder.displayName || "Anonymous Founder"}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Co-founder information not available.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1">
          <Heart className="mr-2 h-5 w-5" /> Follow Startup ({startup.followerCount || 0})
        </Button>
        <Button size="lg" variant="outline" className="flex-1">
          <UserPlus className="mr-2 h-5 w-5" /> Join Team (Request)
        </Button>
        <Button size="lg" variant="outline" className="flex-1">
          <MessageSquare className="mr-2 h-5 w-5" /> Comment
        </Button>
      </div>

      {/* Placeholder for comments section */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Comments section coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
