"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Startup } from "@/types";
import { Users, Eye, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface StartupCardProps {
  startup: Startup;
}

export function StartupCard({ startup }: StartupCardProps) {
  const timeAgo = startup.createdAt ? formatDistanceToNow(new Date(startup.createdAt), { addSuffix: true }) : '';
  
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {startup.logoUrl ? (
              <Image
                src={startup.logoUrl}
                alt={`${startup.name} logo`}
                width={48}
                height={48}
                className="rounded-md border"
                data-ai-hint="company logo"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-muted-foreground text-xl font-semibold">
                {startup.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <CardTitle className="text-lg hover:text-primary">
                <Link href={`/startups/${startup.id}`}>{startup.name}</Link>
              </CardTitle>
              <Badge variant="outline" className="capitalize mt-1 text-xs">{startup.status}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-3">
        <CardDescription className="line-clamp-3 text-sm mb-2">
          {startup.description}
        </CardDescription>
        {startup.tags && startup.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {startup.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {startup.tags.length > 3 && <Badge variant="secondary" className="text-xs">+{startup.tags.length - 3} more</Badge>}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {startup.coFounderIds?.length || 0} founders
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {startup.followerCount || 0} followers
          </span>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/startups/${startup.id}`}>
            View <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
