import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string; // UID from Firebase Auth
  displayName?: string | null;
  email?: string | null; // Should be primary email from Auth
  avatarUrl?: string | null;
  bio?: string;
  skills?: string[];
  preferredLanguages?: string[];
  externalLinks?: { name: string; url: string }[];
  followerCount?: number;
  followingCount?: number;
  joinedStartups?: string[]; // Array of startup IDs
  createdAt?: Timestamp; // Firestore Timestamp
  updatedAt?: Timestamp; // Firestore Timestamp
  // Added for DM chat list
  activeChats?: {
    chatId: string;
    otherUserId: string;
    otherUserDisplayName?: string | null;
    otherUserAvatarUrl?: string | null;
    lastMessage?: string | null;
    lastMessageTimestamp?: Timestamp | null;
    unreadCount?: number;
  }[];
}

export interface Post {
  id: string;
  authorId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string | null; // Ensure null is allowed
  text: string;
  imageUrl?: string;
  hashtags?: string[];
  codeSnippet?: { language: string; code: string };
  createdAt: Timestamp; // Firestore Timestamp
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id:string;
  postId: string;
  authorId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: Timestamp; // Firestore Timestamp
}

export interface CommunityRoom {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  topic: string;
  pinnedMessageId?: string;
  // Messages will be in Realtime Database
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
  createdAt: Timestamp; // Firestore Timestamp
  tags?: string[];
}

// This type can be used when you have fetched both Firebase Auth user and their Firestore profile
export type AppUser = FirebaseUser & UserProfile;

// For Realtime Database messages
export interface DirectMessage {
  id: string; // messageId
  senderId: string;
  text: string;
  timestamp: number; // RTDB typically uses Unix ms timestamp
  readBy?: { [userId: string]: boolean };
}
