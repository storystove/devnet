
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Startup } from "@/types";
import { Users, Tag, Layers, CalendarDays, MessageSquare, UserPlus, Heart, ExternalLink as ExternalLinkIcon } from "lucide-react"; // Renamed LinkIcon to ExternalLinkIcon
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import Link from "next/link";

interface StartupDetailsProps {
  startup: Startup;
}

export function StartupDetails({ startup }: StartupDetailsProps) {
  const createdAtDate = (startup.createdAt as Timestamp)?.toDate ? (startup.createdAt as Timestamp).toDate() : new Date();

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
                className="rounded-lg border-2 border-background shadow-md object-contain"
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
                Created: {format(createdAtDate, "MMMM d, yyyy")}
              </p>
               {startup.websiteUrl && (
                <p className="text-sm text-muted-foreground mt-2 flex items-center">
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  <a href={startup.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Visit Website
                  </a>
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">About {startup.name}</h3>
            <CardDescription className="text-base leading-relaxed">{startup.description}</CardDescription>
          </div>
          
          {startup.screenshotUrls && startup.screenshotUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Screenshots</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {startup.screenshotUrls.map((url, index) => (
                  <div key={index} className="relative aspect-video w-full rounded-md overflow-hidden border">
                    <Image
                      src={url}
                      alt={`${startup.name} screenshot ${index + 1}`}
                      layout="fill"
                      objectFit="contain" // Or "cover", depending on desired display
                      data-ai-hint="startup screenshot application interface"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {startup.coFounderIds && startup.coFounderIds.length > 0 ? (
              <p className="text-sm text-muted-foreground">{startup.coFounderIds.length} co-founder(s).</p>
            ) : <p className="text-sm text-muted-foreground">Co-founder information not available.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1" disabled> 
          <Heart className="mr-2 h-5 w-5" /> Follow Startup ({startup.followerCount || 0})
        </Button>
        <Button size="lg" variant="outline" className="flex-1" disabled> 
          <UserPlus className="mr-2 h-5 w-5" /> Join Team (Request)
        </Button>
        <Button size="lg" variant="outline" className="flex-1" disabled> 
          <MessageSquare className="mr-2 h-5 w-5" /> Comment
        </Button>
      </div>

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
