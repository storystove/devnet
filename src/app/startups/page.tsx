import { AppLayout } from "@/components/layout/AppLayout";
import { StartupCard } from "@/components/startups/StartupCard";
import { Button } from "@/components/ui/button";
import type { Startup } from "@/types";
import Link from "next/link";
import { PlusCircle, Rocket } from "lucide-react";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Startup Showcase | DevNet',
  description: 'Discover innovative startups on DevNet.',
};

// Mock data for demonstration
const mockStartups: Startup[] = [
  {
    id: "startup1",
    name: "AI Innovations",
    logoUrl: "https://placehold.co/100x100.png",
    status: "developing",
    description: "Pioneering new frontiers in artificial intelligence and machine learning solutions for enterprise.",
    techStack: ["Python", "TensorFlow", "Kubernetes"],
    coFounderIds: ["user1", "user2"],
    followerCount: 120,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    tags: ["ai", "machine learning", "enterprise", "saas"],
  },
  {
    id: "startup2",
    name: "EcoFriendly Packaging",
    logoUrl: "https://placehold.co/100x100.png",
    status: "launched",
    description: "Revolutionizing the packaging industry with sustainable and biodegradable materials.",
    techStack: ["Shopify", "React", "Node.js"],
    coFounderIds: ["user3"],
    followerCount: 350,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
    tags: ["sustainability", "ecommerce", "green tech"],
  },
  {
    id: "startup3",
    name: "DevConnect Platform",
    logoUrl: "https://placehold.co/100x100.png",
    status: "idea",
    description: "A new platform to connect developers with exciting projects and collaborators.",
    techStack: ["Next.js", "Firebase", "Tailwind CSS"],
    coFounderIds: [],
    followerCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    tags: ["developer tools", "community", "collaboration"],
  },
];

export default function StartupsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Startup Showcase</h1>
          <Button asChild>
            <Link href="/startups/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Startup
            </Link>
          </Button>
        </div>
        {mockStartups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        ) : (
           <div className="text-center py-10">
            <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-xl font-semibold">No Startups Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to showcase your startup!
            </p>
            <Button asChild className="mt-4">
                <Link href="/startups/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Your Startup
                </Link>
            </Button>
           </div>
        )}
      </div>
    </AppLayout>
  );
}
