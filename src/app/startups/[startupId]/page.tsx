import { AppLayout } from "@/components/layout/AppLayout";
import { StartupDetails } from "@/components/startups/StartupDetails";
import type { Startup } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from 'next';

// Mock data for demonstration
const mockStartup: Startup = {
  id: "startup1",
  name: "AI Innovations",
  logoUrl: "https://placehold.co/200x200.png",
  status: "developing",
  description: "Pioneering new frontiers in artificial intelligence and machine learning solutions for enterprise. Our mission is to democratize AI and make it accessible for businesses of all sizes. We are building a suite of tools that leverage cutting-edge algorithms to solve real-world problems, from data analysis to automated decision making.",
  techStack: ["Python", "TensorFlow", "PyTorch", "Kubernetes", "Docker", "React", "Node.js"],
  coFounderIds: ["user1", "user2"],
  followerCount: 125,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
  tags: ["ai", "machine learning", "enterprise", "saas", "big data", "automation"],
};

interface StartupPageProps {
  params: { startupId: string };
}

export async function generateMetadata({ params }: StartupPageProps): Promise<Metadata> {
  // In a real app, fetch startup data here
  const startup = mockStartup; // Using mock data
  return {
    title: `${startup.name} | DevNet`,
    description: startup.description.substring(0,160),
  };
}


export default function StartupPage({ params }: StartupPageProps) {
  // In a real app, you would fetch startup data based on params.startupId
  const startup = mockStartup; // Using mock data

  if (!startup) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p>Startup not found.</p>
           <Button variant="link" asChild className="mt-4">
            <Link href="/startups">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Startups
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-4">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/startups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startups
          </Link>
        </Button>
        <StartupDetails startup={startup} />
      </div>
    </AppLayout>
  );
}
