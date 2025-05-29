
"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { Startup, Review as ReviewType } from "@/types";
import { Users, Tag, Layers, CalendarDays, MessageSquare, UserPlus, Heart, ExternalLink as ExternalLinkIcon, Star, Send, ThumbsUp, Loader2, Edit3, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, writeBatch, increment, getDoc } from "firebase/firestore";
import { useEffect, useState, FormEvent, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { ReviewItem } from "./ReviewItem";
import { useRouter } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"; // Added ScrollArea and ScrollBar

interface StartupDetailsProps {
  startup: Startup;
}

export function StartupDetails({ startup: initialStartup }: StartupDetailsProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [startup, setStartup] = useState<Startup>(initialStartup);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState<number>(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasRequestedToJoin, setHasRequestedToJoin] = useState(false);
  const [isJoinRequestLoading, setIsJoinRequestLoading] = useState(false);
  const [isFollowingStartup, setIsFollowingStartup] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isCreator = currentUser?.uid === startup.creatorId;


  const createdAtDate = (startup.createdAt as Timestamp)?.toDate ? (startup.createdAt as Timestamp).toDate() : new Date();

  // Fetch reviews
  useEffect(() => {
    const reviewsRef = collection(db, "startups", startup.id, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReviewType)));
    });
    return () => unsubscribe();
  }, [startup.id]);

  // Check if user has already requested to join
  useEffect(() => {
    if (!currentUser) return;
    const checkRequest = async () => {
      const requestRef = doc(db, "startups", startup.id, "joinRequests", currentUser.uid);
      const docSnap = await getDoc(requestRef);
      setHasRequestedToJoin(docSnap.exists());
    };
    checkRequest();
  }, [currentUser, startup.id]);
  
  // Check if user is following startup
   useEffect(() => {
    if (!currentUser) return;
    const checkFollow = async () => {
      const followRef = doc(db, "users", currentUser.uid, "followedStartups", startup.id);
      const docSnap = await getDoc(followRef);
      setIsFollowingStartup(docSnap.exists());
    };
    checkFollow();
  }, [currentUser, startup.id]);


  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Please sign in to leave a review.", variant: "destructive" });
      return;
    }
    if (newReviewRating === 0) {
      toast({ title: "Please select a star rating.", variant: "destructive" });
      return;
    }
    if (!newReviewText.trim()) {
      toast({ title: "Please write a review.", variant: "destructive" });
      return;
    }
    setIsSubmittingReview(true);

    const reviewData = {
      startupId: startup.id,
      userId: currentUser.uid,
      userDisplayName: currentUser.displayName || currentUser.email,
      userAvatarUrl: currentUser.photoURL || null,
      rating: newReviewRating,
      text: newReviewText.trim(),
      createdAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      const reviewRef = doc(collection(db, "startups", startup.id, "reviews"));
      batch.set(reviewRef, reviewData);

      // Update average rating and review count on startup
      const startupRef = doc(db, "startups", startup.id);
      const currentTotalRating = (startup.averageRating || 0) * (startup.reviewCount || 0);
      const newReviewCount = (startup.reviewCount || 0) + 1;
      const newAverageRating = (currentTotalRating + newReviewRating) / newReviewCount;
      
      batch.update(startupRef, {
        averageRating: newAverageRating,
        reviewCount: newReviewCount
      });
      
      await batch.commit();

      setStartup(prev => ({
        ...prev,
        averageRating: newAverageRating,
        reviewCount: newReviewCount
      }));
      setNewReviewText("");
      setNewReviewRating(0);
      toast({ title: "Review submitted!" });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({ title: "Error", description: "Could not submit your review.", variant: "destructive" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleJoinTeamRequest = async () => {
    if (!currentUser) {
      toast({ title: "Please sign in to request to join.", variant: "destructive" });
      return;
    }
    setIsJoinRequestLoading(true);
    try {
      const requestRef = doc(db, "startups", startup.id, "joinRequests", currentUser.uid);
      await setDoc(requestRef, {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || currentUser.email,
        userAvatarUrl: currentUser.photoURL || null,
        requestedAt: serverTimestamp(),
        status: "pending", 
      });

      const notificationRef = collection(db, "users", startup.creatorId, "notifications");
      await addDoc(notificationRef, {
        recipientId: startup.creatorId,
        type: 'startup_join_request',
        fromUserId: currentUser.uid,
        fromUserDisplayName: currentUser.displayName || currentUser.email,
        fromUserAvatarUrl: currentUser.photoURL || null,
        startupId: startup.id,
        startupName: startup.name,
        timestamp: serverTimestamp(),
        read: false,
        link: `/startups/${startup.id}?tab=requests` 
      });

      setHasRequestedToJoin(true);
      toast({ title: "Request Sent!", description: `Your request to join ${startup.name} has been sent.` });
    } catch (error) {
      console.error("Error sending join request:", error);
      toast({ title: "Error", description: "Could not send your join request.", variant: "destructive" });
    } finally {
      setIsJoinRequestLoading(false);
    }
  };
  
  const handleFollowStartupToggle = async () => {
    if (!currentUser) {
        toast({ title: "Please sign in to follow startups.", variant: "destructive" });
        return;
    }
    setIsFollowLoading(true);
    const startupRef = doc(db, "startups", startup.id);
    const userFollowRef = doc(db, "users", currentUser.uid, "followedStartups", startup.id);
    const batch = writeBatch(db);

    try {
        if (isFollowingStartup) {
            batch.delete(userFollowRef);
            batch.update(startupRef, { followerCount: increment(-1) });
            await batch.commit();
            setIsFollowingStartup(false);
            setStartup(prev => ({ ...prev, followerCount: Math.max(0, (prev.followerCount || 0) - 1) }));
            toast({ title: `Unfollowed ${startup.name}` });
        } else {
            batch.set(userFollowRef, { startupId: startup.id, followedAt: serverTimestamp() });
            batch.update(startupRef, { followerCount: increment(1) });
            await batch.commit();
            setIsFollowingStartup(true);
            setStartup(prev => ({ ...prev, followerCount: (prev.followerCount || 0) + 1 }));
            toast({ title: `Following ${startup.name}` });
        }
    } catch (error) {
        console.error("Error toggling follow startup:", error);
        toast({ title: "Error", description: "Could not update follow status.", variant: "destructive" });
    } finally {
        setIsFollowLoading(false);
    }
  };

  const handleContactTeam = () => {
    if (!currentUser) {
      toast({ title: "Please sign in to contact the team.", variant: "destructive" });
      return;
    }
    if (currentUser.uid === startup.creatorId) {
      toast({ title: "You are the creator of this startup.", variant: "default" });
      return;
    }
    const ids = [currentUser.uid, startup.creatorId].sort();
    const chatId = ids.join('_');
    router.push(`/messages/${chatId}`);
  };


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
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-sm py-1 px-2">{startup.status}</Badge>
                {startup.averageRating && startup.reviewCount && startup.reviewCount > 0 ? (
                    <div className="flex items-center text-sm text-amber-500">
                        <Star className="h-4 w-4 mr-1 fill-amber-500" />
                        {startup.averageRating.toFixed(1)} ({startup.reviewCount} reviews)
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                )}
              </div>
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
            {isCreator && (
                <Button asChild variant="outline">
                    <Link href={`/startups/${startup.id}/edit`}>
                        <Edit3 className="mr-2 h-4 w-4" /> Edit Startup
                    </Link>
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">About {startup.name}</h3>
            <CardDescription className="text-base leading-relaxed">{startup.description}</CardDescription>
          </div>

          {startup.screenshotUrls && startup.screenshotUrls.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary"/>Screenshots</h3>
              <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <div className="flex space-x-4 pb-4">
                  {startup.screenshotUrls.map((url, index) => (
                    <a 
                      key={index} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block rounded-lg overflow-hidden border hover:opacity-90 transition-opacity shadow-md"
                    >
                      <div className="relative h-40 w-64 sm:h-48 sm:w-72 md:h-56 md:w-80"> {/* Consistent aspect ratio & height */}
                        <Image
                          src={url}
                          alt={`${startup.name} screenshot ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          className="rounded-lg"
                          data-ai-hint="startup screenshot application interface"
                        />
                      </div>
                    </a>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
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
              <div className="flex flex-wrap gap-2">
                {startup.coFounderIds.map(founderId => (
                    <Link key={founderId} href={`/profile/${founderId}`}>
                        <Badge variant="secondary" className="hover:bg-primary/10 cursor-pointer">
                            Founder: {founderId.substring(0,6)}... 
                            <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </Badge>
                    </Link>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Co-founder information not available.</p>}
          </div>
        </CardContent>
         <CardFooter className="p-4 border-t flex flex-wrap gap-2">
            <Button 
                size="lg" 
                className="flex-1 min-w-[150px]" 
                onClick={handleFollowStartupToggle} 
                disabled={!currentUser || isFollowLoading || isCreator}
                variant={isFollowingStartup ? "outline" : "default"}
            >
                {isFollowLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Heart className="mr-2 h-5 w-5" />} 
                {isFollowingStartup ? "Unfollow" : "Follow"} ({startup.followerCount || 0})
            </Button>
            {!isCreator && (
                <>
                <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 min-w-[150px]" 
                    onClick={handleJoinTeamRequest} 
                    disabled={!currentUser || hasRequestedToJoin || isJoinRequestLoading || startup.coFounderIds.includes(currentUser?.uid || '')}
                >
                    {isJoinRequestLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />} 
                    {hasRequestedToJoin ? "Request Sent" : startup.coFounderIds.includes(currentUser?.uid || '') ? "Already a Member" : "Join Team"}
                </Button>
                <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 min-w-[150px]" 
                    onClick={handleContactTeam}
                    disabled={!currentUser}
                > 
                    <MessageSquare className="mr-2 h-5 w-5" /> Contact Team
                </Button>
                </>
            )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reviews for {startup.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser && !isCreator && (
            <form onSubmit={handleReviewSubmit} className="mb-6 p-4 border rounded-lg shadow-sm space-y-3 bg-muted/30">
              <h4 className="text-md font-semibold">Leave a Review</h4>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Your Rating</label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant={newReviewRating >= star ? "default" : "ghost"}
                      size="icon"
                      onClick={() => setNewReviewRating(star)}
                      className={`p-1 h-8 w-8 border 
                        ${newReviewRating >= star ? 'text-amber-400 border-amber-400 bg-amber-400/10 hover:bg-amber-400/20' 
                                                  : 'text-muted-foreground hover:border-amber-300 hover:text-amber-400'}`}
                    >
                      <Star className={`h-5 w-5 ${newReviewRating >= star ? 'fill-amber-400' : 'fill-transparent'}`} />
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Share your experience with this startup..."
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                className="min-h-[80px] bg-background"
                disabled={isSubmittingReview}
              />
              <Button type="submit" disabled={isSubmittingReview || newReviewRating === 0 || !newReviewText.trim()}>
                {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Review
              </Button>
            </form>
          )}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(review => <ReviewItem key={review.id} review={review} />)}
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
