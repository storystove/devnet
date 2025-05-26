
"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@/types";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { ThumbsUp, MessageCircle, Share2, Code, CornerDownRight } from "lucide-react";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  // Convert Firestore Timestamp to JavaScript Date for formatDistanceToNow
  const createdAtDate = (post.createdAt as Timestamp)?.toDate ? (post.createdAt as Timestamp).toDate() : new Date();
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <Card className="mb-6 shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center space-x-4 p-4">
        <Link href={`/profile/${post.authorId}`}>
          <Avatar>
            <AvatarImage src={post.authorAvatarUrl || undefined} data-ai-hint="profile avatar" alt={post.authorDisplayName || "User"} />
            <AvatarFallback>{post.authorDisplayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link href={`/profile/${post.authorId}`}>
            <CardTitle className="text-base font-semibold hover:underline">{post.authorDisplayName || "Anonymous User"}</CardTitle>
          </Link>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2 space-y-3">
        <p className="text-sm whitespace-pre-wrap">{post.text}</p>
        {post.imageUrl && (
          <div className="relative aspect-video w-full max-h-[400px] rounded-md overflow-hidden border">
            <Image
              src={post.imageUrl}
              alt="Post image"
              layout="fill"
              objectFit="cover"
              data-ai-hint="social media image"
            />
          </div>
        )}
        {post.codeSnippet && post.codeSnippet.code && (
          <div className="bg-muted p-3 rounded-md border">
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline" className="text-xs">{post.codeSnippet.language || "Code"}</Badge>
              <Code className="h-4 w-4 text-muted-foreground"/>
            </div>
            <pre className="text-xs overflow-x-auto bg-background p-2 rounded font-mono max-h-60">
              <code>{post.codeSnippet.code}</code>
            </pre>
          </div>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 border-t">
        <div className="flex space-x-1 sm:space-x-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" disabled>
            <ThumbsUp className="mr-1 h-4 w-4" />
            <span className="text-xs">{post.likeCount || 0}</span>
            <span className="sr-only">Likes</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" disabled>
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">{post.commentCount || 0}</span>
             <span className="sr-only">Comments</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" disabled>
            <Share2 className="mr-1 h-4 w-4" />
            <span className="text-xs hidden sm:inline">Share</span>
             <span className="sr-only">Share</span>
          </Button>
        </div>
         <Button variant="outline" size="sm" disabled>
            <CornerDownRight className="mr-1 h-4 w-4" />
            <span className="text-xs">Reply</span>
         </Button>
      </CardFooter>
    </Card>
  );
}
