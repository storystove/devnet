
"use client";

import type { Review } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import Link from "next/link";

interface ReviewItemProps {
  review: Review;
}

export function ReviewItem({ review }: ReviewItemProps) {
  const createdAtDate = (review.createdAt as Timestamp)?.toDate ? (review.createdAt as Timestamp).toDate() : new Date();
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <Card className="bg-muted/30 shadow-sm">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Link href={`/profile/${review.userId}`}>
                    <Avatar className="h-8 w-8">
                    <AvatarImage src={review.userAvatarUrl || undefined} alt={review.userDisplayName || "User"} data-ai-hint="profile avatar small" />
                    <AvatarFallback>{review.userDisplayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                </Link>
                <div>
                    <Link href={`/profile/${review.userId}`}>
                        <p className="text-sm font-semibold hover:underline">{review.userDisplayName || "Anonymous User"}</p>
                    </Link>
                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
            </div>
            <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? 'fill-amber-500' : 'fill-muted stroke-muted-foreground'}`}
                />
                ))}
                <span className="ml-1.5 text-sm font-semibold">{review.rating.toFixed(1)}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap">{review.text}</p>
      </CardContent>
    </Card>
  );
}
