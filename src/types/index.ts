import type { User as FirebaseUser } from "firebase/auth";

export interface UserProfile {
  id: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  bio?: string;
  skills?: string[];
  preferredLanguages?: string[];
  externalLinks?: { name: string; url: string }[];
  followerCount?: number;
  followingCount?: number;
  joinedStartups?: string[]; // Array of startup IDs
}

export interface Post {
  id: string;
  authorId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  text: string;
  imageUrl?: string;
  hashtags?: string[];
  codeSnippet?: { language: string; code: string };
  createdAt: Date;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: Date;
}

export interface CommunityRoom {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  topic: string;
  pinnedMessageId?: string;
}

export interface Startup {
  id: string;
  name: string;
  logoUrl?: string;
  status: "idea" | "developing" | "launched" | "scaling" | "acquired";
  description: string;
  techStack?: string[];
  coFounderIds?: string[]; // Array of user IDs
  followerCount?: number;
  createdAt: Date;
  tags?: string[];
}

export type AppUser = FirebaseUser & UserProfile;
