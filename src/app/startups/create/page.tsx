import { AppLayout } from "@/components/layout/AppLayout";
import { CreateStartupForm } from "@/components/startups/CreateStartupForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Startup | CollabForge',
  description: 'Showcase your new startup on CollabForge.',
};

export default function CreateStartupPage() {
  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/startups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Startups
          </Link>
        </Button>
        <CreateStartupForm />
      </div>
    </AppLayout>
  );
}
