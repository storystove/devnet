
import type { User as FirebaseUser } from "firebase/auth";
import type { Timestamp, FieldValue } from "firebase/firestore";

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
  activeChats?: {
    chatId: string;
    otherUserId: string;
    otherUserDisplayName?: string | null;
    otherUserAvatarUrl?: string | null;
    lastMessage?: string | null;
    lastMessageTimestamp?: Timestamp | null;
    unreadCount?: number;
  }[];
  unreadNotificationCount?: number; // For quick display, might be denormalized
  profileSetupCompleted?: boolean; // Added for onboarding flow
}

export interface Post {
  id: string;
  authorId: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string | null;
  text: string;
  imageUrl?: string | null;
  hashtags?: string[];
  codeSnippet?: { language: string; code: string };
  createdAt: Timestamp;
  likeCount: number;
  commentCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  text: string;
  createdAt: Timestamp;
}

export interface Review {
  id: string;
  startupId: string;
  userId: string;
  userDisplayName: string | null;
  userAvatarUrl?: string | null;
  rating: number; // 1 to 5
  text: string;
  createdAt: Timestamp;
}

export interface CommunityRoom {
  id: string;
  name: string;
  description?: string;
  topic: string;
  creatorId: string;
  creatorDisplayName?: string | null;
  creatorAvatarUrl?: string | null;
  memberCount: number;
  createdAt: Timestamp | FieldValue;
  pinnedMessageId?: string;
}

export interface Startup {
  id: string;
  name: string;
  logoUrl?: string | null;
  status: "idea" | "developing" | "launched" | "scaling" | "acquired";
  description: string;
  techStack?: string[];
  creatorId: string;
  coFounderIds: string[];
  followerCount: number;
  createdAt: Timestamp | FieldValue;
  tags?: string[];
  websiteUrl?: string | null;
  screenshotUrls?: string[] | null;
  averageRating?: number;
  reviewCount?: number;
}

export type AppUser = FirebaseUser & UserProfile;

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  readBy?: { [userId: string]: boolean };
}

export type NotificationType = 'follow' | 'dm' | 'like' | 'comment' | 'startup_join_request';

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  fromUserId: string;
  fromUserDisplayName: string | null;
  fromUserAvatarUrl?: string | null;
  postId?: string;
  chatId?: string;
  startupId?: string; // For startup related notifications
  startupName?: string; // For startup related notifications
  messageSnippet?: string;
  timestamp: Timestamp;
  read: boolean;
  link: string;
}
