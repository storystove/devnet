
"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/types";
import { Mail, Link as LinkIcon, Briefcase, Languages, Users, UserCheck, Edit3, ExternalLink, UserPlus, UserMinus, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, writeBatch, serverTimestamp, increment, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProfileDisplayProps {
  profile: UserProfile;
  isCurrentUser?: boolean;
}

export function ProfileDisplay({ profile, isCurrentUser = false }: ProfileDisplayProps) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [currentFollowerCount, setCurrentFollowerCount] = useState(profile.followerCount || 0);

  const displayName = profile.displayName || profile.email?.split('@')[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const checkFollowStatus = useCallback(async () => {
    if (!currentUser || !profile || currentUser.uid === profile.id) return;
    setIsFollowLoading(true);
    try {
      const followingRef = doc(db, "users", currentUser.uid, "following", profile.id);
      const docSnap = await getDoc(followingRef);
      setIsFollowing(docSnap.exists());
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setIsFollowLoading(false);
    }
  }, [currentUser, profile]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  useEffect(() => {
    setCurrentFollowerCount(profile.followerCount || 0);
  }, [profile.followerCount]);


  const handleFollowToggle = async () => {
    if (!currentUser || !profile || authLoading) {
      toast({ title: "Please sign in to follow users.", variant: "destructive" });
      return;
    }
    if (currentUser.uid === profile.id) {
      toast({ title: "You cannot follow yourself.", variant: "default" });
      return;
    }

    setIsFollowLoading(true);
    const batch = writeBatch(db);

    const currentUserFollowingRef = doc(db, "users", currentUser.uid, "following", profile.id);
    const targetUserFollowersRef = doc(db, "users", profile.id, "followers", currentUser.uid);
    const currentUserProfileRef = doc(db, "users", currentUser.uid);
    const targetUserProfileRef = doc(db, "users", profile.id);

    try {
      if (isFollowing) { // Unfollow
        batch.delete(currentUserFollowingRef);
        batch.delete(targetUserFollowersRef);
        batch.update(currentUserProfileRef, { 
          followingCount: increment(-1),
          updatedAt: serverTimestamp() 
        });
        batch.update(targetUserProfileRef, { 
          followerCount: increment(-1),
          updatedAt: serverTimestamp()  
        });
        await batch.commit();
        setIsFollowing(false);
        setCurrentFollowerCount(prev => Math.max(0, prev -1));
        toast({ title: `Unfollowed ${displayName}` });
      } else { // Follow
        batch.set(currentUserFollowingRef, { 
          userId: profile.id, 
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          followedAt: serverTimestamp() 
        });
        batch.set(targetUserFollowersRef, { 
          userId: currentUser.uid, 
          displayName: currentUser.displayName,
          avatarUrl: currentUser.photoURL,
          followedAt: serverTimestamp() 
        });
        batch.update(currentUserProfileRef, { 
          followingCount: increment(1),
          updatedAt: serverTimestamp() 
        });
        batch.update(targetUserProfileRef, { 
          followerCount: increment(1),
          updatedAt: serverTimestamp()  
        });
        await batch.commit();
        setIsFollowing(true);
        setCurrentFollowerCount(prev => prev + 1);
        toast({ title: `Followed ${displayName}` });
      }
    } catch (error: any) {
      console.error("Error following/unfollowing user:", error);
      toast({ title: "Action Failed", description: error.message || "Could not update follow status.", variant: "destructive" });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!currentUser || !profile || currentUser.uid === profile.id) {
      toast({ title: "Cannot message this user.", variant: "destructive" });
      return;
    }
    // Create a unique chat ID (sorted UIDs)
    const ids = [currentUser.uid, profile.id].sort();
    const chatId = ids.join('_');
    router.push(`/messages/${chatId}`);
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-muted/30 p-6 border-b">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 text-3xl border-2 border-background shadow-md">
            <AvatarImage src={profile.avatarUrl || undefined} alt={displayName} data-ai-hint="profile avatar large" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-1">
            <CardTitle className="text-3xl font-bold">{displayName}</CardTitle>
            {profile.email && (
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start mt-1">
                <Mail className="mr-2 h-4 w-4" /> {profile.email}
              </p>
            )}
             <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center"><Users className="mr-1 h-4 w-4" /> {currentFollowerCount} Followers</span>
                <span className="flex items-center"><UserCheck className="mr-1 h-4 w-4" /> {profile.followingCount || 0} Following</span>
            </div>
          </div>
          {isCurrentUser && (
            <Button asChild variant="outline">
              <Link href="/profile/edit">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold mb-1">Bio</h3>
            <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
            </div>
          </div>
        )}

        {profile.preferredLanguages && profile.preferredLanguages.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Languages className="mr-2 h-5 w-5 text-primary" />Preferred Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredLanguages.map(lang => <Badge key={lang} variant="secondary">{lang}</Badge>)}
            </div>
          </div>
        )}

        {profile.externalLinks && profile.externalLinks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><LinkIcon className="mr-2 h-5 w-5 text-primary" />Links</h3>
            <ul className="space-y-1">
              {profile.externalLinks.map(link => (
                <li key={link.name} className="text-sm">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                    {link.name} <ExternalLink className="ml-1 h-3 w-3"/>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
         <div>
            <h3 className="text-lg font-semibold mb-2">Joined Startups</h3>
            {profile.joinedStartups && profile.joinedStartups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profile.joinedStartups.map(startupId => (
                        <Card key={startupId} className="p-2 text-sm">
                           <Link href={`/startups/${startupId}`} className="hover:text-primary font-medium">Startup {startupId.substring(0,4)}...</Link>
                        </Card>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">Not part of any startups yet.</p>}
         </div>

      </CardContent>
      {!isCurrentUser && currentUser && (
         <CardFooter className="border-t p-4 flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleFollowToggle} 
              disabled={isFollowLoading || authLoading} 
              className="w-full sm:w-auto"
              variant={isFollowing ? "outline" : "default"}
            >
              {isFollowLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isFollowing ? (
                <UserMinus className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isFollowing ? "Unfollow" : `Follow`} {displayName}
            </Button>
            <Button 
              onClick={handleMessage} 
              variant="outline" 
              className="w-full sm:w-auto"
              disabled={authLoading}
            >
                <MessageSquare className="mr-2 h-4 w-4" /> Message
            </Button>
         </CardFooter>
      )}
    </Card>
  );
}
