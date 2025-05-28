
"use client";

import type { Comment } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import Link from "next/link";

interface CommentItemProps {
  comment: Comment;
}

export function CommentItem({ comment }: CommentItemProps) {
  const createdAtDate = (comment.createdAt as Timestamp)?.toDate ? (comment.createdAt as Timestamp).toDate() : new Date();
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <div className="flex items-start gap-3">
      <Link href={`/profile/${comment.authorId}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.authorAvatarUrl || undefined} alt={comment.authorDisplayName || "User"} data-ai-hint="profile avatar small" />
          <AvatarFallback>{comment.authorDisplayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 bg-background p-3 rounded-md shadow-sm border">
        <div className="flex items-center justify-between mb-1">
          <Link href={`/profile/${comment.authorId}`}>
            <span className="text-xs font-semibold hover:underline">{comment.authorDisplayName || "Anonymous"}</span>
          </Link>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
      </div>
    </div>
  );
}
