
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { PostCard } from "@/components/feed/PostCard";
import type { Post, UserProfile } from "@/types";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, getDocs, limit, startAfter, where, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserSearchBar } from "@/components/search/UserSearchBar";
import { UserSearchResultItem } from "@/components/search/UserSearchResultItem";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";

const POSTS_PER_PAGE = 10;

export default function HomePage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [lastVisiblePost, setLastVisiblePost] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const [isCreatePostExpanded, setIsCreatePostExpanded] = useState(false);

  const fetchPosts = useCallback(async (loadMore = false) => {
    if (!loadMore) {
      setIsLoadingPosts(true);
      setLastVisiblePost(null); // Reset for initial fetch
    }
    try {
      let postsQuery;
      const postsCollection = collection(db, "posts");

      if (loadMore && lastVisiblePost) {
        postsQuery = query(
          postsCollection,
          orderBy("createdAt", "desc"),
          startAfter(lastVisiblePost),
          limit(POSTS_PER_PAGE)
        );
      } else {
        postsQuery = query(
          postsCollection,
          orderBy("createdAt", "desc"),
          limit(POSTS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(postsQuery);
      const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));

      if (querySnapshot.docs.length > 0) {
        setLastVisiblePost(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setHasMorePosts(false);
      }

      setPosts(prevPosts => loadMore ? [...prevPosts, ...fetchedPosts] : fetchedPosts);
      if (fetchedPosts.length < POSTS_PER_PAGE) {
        setHasMorePosts(false);
      }

    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error fetching posts",
        description: "Could not load posts from the server.",
        variant: "destructive",
      });
      setHasMorePosts(false);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast, lastVisiblePost]);

  useEffect(() => {
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch

  const handleSearchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearchAttempted(false);
      return;
    }
    setIsSearching(true);
    setSearchAttempted(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("displayName", ">=", searchTerm),
        where("displayName", "<=", searchTerm + '\uf8ff'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setSearchResults(users);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error searching users",
        description: "Could not perform user search.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handlePostCreatedAndCollapse = (newPost: Post) => {
    // Add the new post to the beginning of the list
    setPosts(prevPosts => [newPost, ...prevPosts]);
    setIsCreatePostExpanded(false); // Collapse the form
  };


  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-4">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Social Feed</h1>
        
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-card">
          <h2 className="text-xl font-semibold mb-3 text-foreground">Search Users</h2>
          <UserSearchBar onSearch={handleSearchUsers} isLoading={isSearching} />
          {isSearching && <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-primary" />}
          {!isSearching && searchAttempted && searchResults.length === 0 && (
            <p className="mt-4 text-center text-muted-foreground">No users found matching your search.</p>
          )}
          {!isSearching && searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map(user => (
                <UserSearchResultItem key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
        
        {currentUser && !isCreatePostExpanded && (
          <Card
            className="mb-6 shadow-lg cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setIsCreatePostExpanded(true)}
            tabIndex={0} 
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsCreatePostExpanded(true); }}
            role="button"
            aria-expanded="false"
            aria-label="Create a new post"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} data-ai-hint="profile avatar current user" />
                  <AvatarFallback>{currentUser.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 p-2.5 bg-background rounded-full border border-input text-left text-muted-foreground hover:border-primary/50">
                  What's on your mind, {currentUser.displayName?.split(' ')[0] || "Developer"}?
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {isCreatePostExpanded && (
          <CreatePostForm onPostCreated={handlePostCreatedAndCollapse} />
        )}
        {!currentUser && (
           <Card className="mb-6 shadow-lg">
            <CardContent className="p-6 text-center text-muted-foreground">
              <Link href="/signin" className="text-primary hover:underline font-semibold">Sign in</Link> to create a post and join the conversation.
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

        {isLoadingPosts && posts.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Posts Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {hasMorePosts && !isLoadingPosts && posts.length > 0 && (
          <div className="mt-8 text-center">
            <Button onClick={() => fetchPosts(true)} variant="outline" disabled={isLoadingPosts}>
              {isLoadingPosts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load More Posts
            </Button>
          </div>
        )}
         {!hasMorePosts && posts.length > 0 && (
          <p className="mt-8 text-center text-muted-foreground">No more posts to load.</p>
        )}
      </div>
    </AppLayout>
  );
}
