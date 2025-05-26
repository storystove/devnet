import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePostForm } from "@/components/feed/CreatePostForm";
import { PostCard } from "@/components/feed/PostCard";
import type { Post } from "@/types";
import { Separator } from "@/components/ui/separator";

// Mock data for demonstration
const mockPosts: Post[] = [
  {
    id: "1",
    authorId: "user123",
    authorDisplayName: "Alice Wonderland",
    authorAvatarUrl: "https://placehold.co/100x100.png",
    text: "Excited to start my new project on CollabForge! Looking for collaborators interested in AI-driven art generation. #AI #Art #Collaboration",
    hashtags: ["ai", "art", "collaboration"],
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likeCount: 15,
    commentCount: 3,
  },
  {
    id: "2",
    authorId: "user456",
    authorDisplayName: "Bob The Builder",
    authorAvatarUrl: "https://placehold.co/100x100.png",
    text: "Just pushed a new update to my open-source library. Check out the latest features! Here's a quick snippet:",
    codeSnippet: {
      language: "typescript",
      code: `function greet(name: string): string {\n  return \`Hello, \${name}!\`;\n}`,
    },
    imageUrl: "https://placehold.co/600x400.png",
    hashtags: ["opensource", "typescript", "development"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likeCount: 42,
    commentCount: 7,
  },
  {
    id: "3",
    authorId: "user789",
    authorDisplayName: "Charlie Brown",
    authorAvatarUrl: "https://placehold.co/100x100.png",
    text: "Thinking about the future of decentralized social media. What are your thoughts? #web3 #socialmedia #decentralization",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    likeCount: 28,
    commentCount: 11,
  },
];


export default function HomePage() {
  return (
    <AppLayout>
      <div className="container mx-auto max-w-3xl py-4">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Social Feed</h1>
        <CreatePostForm />
        <Separator className="my-8" />
        <div className="space-y-6">
          {mockPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
