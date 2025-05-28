
"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post, Comment as CommentType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { ThumbsUp, MessageCircle, Share2, Code, Send, Loader2, HeartCrack } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, increment, writeBatch, Unsubscribe } from "firebase/firestore";
import { useEffect, useState, useRef, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "./CommentItem"; // We will create this component

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [isLiked, setIsLiked] = useState(false);
  const [currentLikeCount, setCurrentLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [currentCommentCount, setCurrentCommentCount] = useState(post.commentCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Convert Firestore Timestamp to JavaScript Date for formatDistanceToNow
  const createdAtDate = (post.createdAt as Timestamp)?.toDate ? (post.createdAt as Timestamp).toDate() : new Date();
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  useEffect(() => {
    if (!currentUser) return;
    const likeRef = doc(db, "posts", post.id, "likes", currentUser.uid);
    getDoc(likeRef).then((docSnap) => {
      setIsLiked(docSnap.exists());
    });
  }, [currentUser, post.id]);

  useEffect(() => {
    const commentsRef = collection(db, "posts", post.id, "comments");
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommentType));
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [post.id]);

  const handleLikeToggle = async () => {
    if (!currentUser) {
      toast({ title: "Please sign in to like posts.", variant: "destructive" });
      return;
    }
    setIsLiking(true);
    const postRef = doc(db, "posts", post.id);
    const likeRef = doc(db, "posts", post.id, "likes", currentUser.uid);

    const batch = writeBatch(db);

    try {
      if (isLiked) {
        batch.delete(likeRef);
        batch.update(postRef, { likeCount: increment(-1) });
        await batch.commit();
        setIsLiked(false);
        setCurrentLikeCount(prev => Math.max(0, prev - 1));
      } else {
        batch.set(likeRef, { likedAt: serverTimestamp(), userId: currentUser.uid });
        batch.update(postRef, { likeCount: increment(1) });
        await batch.commit();
        setIsLiked(true);
        setCurrentLikeCount(prev => prev + 1);
        // TODO: Add notification for post author
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({ title: "Error", description: "Could not update like status.", variant: "destructive" });
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Please sign in to comment.", variant: "destructive" });
      return;
    }
    if (!newComment.trim()) {
      toast({ title: "Comment cannot be empty.", variant: "destructive" });
      return;
    }
    setIsCommenting(true);

    const postRef = doc(db, "posts", post.id);
    const commentsRef = collection(db, "posts", post.id, "comments");

    try {
      const batch = writeBatch(db);
      const newCommentRef = doc(commentsRef); // Auto-generate ID

      batch.set(newCommentRef, {
        postId: post.id,
        authorId: currentUser.uid,
        authorDisplayName: currentUser.displayName || currentUser.email,
        authorAvatarUrl: currentUser.photoURL || null,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      batch.update(postRef, { commentCount: increment(1) });
      
      await batch.commit();
      setNewComment("");
      setCurrentCommentCount(prev => prev + 1);
      toast({ title: "Comment added!" });
      // TODO: Add notification for post author
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ title: "Error", description: "Could not add comment.", variant: "destructive" });
    } finally {
      setIsCommenting(false);
    }
  };
  
  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
        // Timeout to allow section to render before focusing
        setTimeout(() => commentInputRef.current?.focus(), 0);
    }
  };

  const handleShare = () => {
    // Basic share functionality: copy post link (if we had individual post pages)
    // For now, a placeholder or copy current page URL
    navigator.clipboard.writeText(window.location.href) // This will copy the feed URL
      .then(() => toast({ title: "Link Copied!", description: "Post link copied to clipboard (Feed URL for now)." }))
      .catch(() => toast({ title: "Error", description: "Could not copy link.", variant: "destructive" }));
  };


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
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={handleLikeToggle} disabled={isLiking || !currentUser}>
            {isLiking ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : (isLiked ? <ThumbsUp className="mr-1 h-4 w-4 text-primary fill-primary" /> : <ThumbsUp className="mr-1 h-4 w-4" />)}
            <span className="text-xs">{currentLikeCount}</span>
            <span className="sr-only">Likes</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={toggleComments}>
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">{currentCommentCount}</span>
             <span className="sr-only">Comments</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" />
            <span className="text-xs hidden sm:inline">Share</span>
             <span className="sr-only">Share</span>
          </Button>
        </div>
         <Button variant="outline" size="sm" onClick={toggleComments}>
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">Reply</span>
         </Button>
      </CardFooter>

      {showComments && (
        <div className="p-4 border-t bg-muted/30">
          <h4 className="text-sm font-semibold mb-3">Comments</h4>
          {currentUser && (
            <form onSubmit={handleAddComment} className="flex items-start gap-2 mb-4">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} data-ai-hint="profile avatar small" />
                <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <Textarea
                ref={commentInputRef}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow min-h-[40px]"
                rows={1}
                disabled={isCommenting}
              />
              <Button type="submit" size="icon" disabled={isCommenting || !newComment.trim()}>
                {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          )}
          {comments.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </Card>
  );
}
