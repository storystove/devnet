import { AppLayout } from "@/components/layout/AppLayout";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import type { Metadata } from 'next';
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: 'Edit Profile | DevNet',
  description: 'Update your DevNet profile information.',
};

export default function EditProfilePage() {
  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-4">
        <Button variant="ghost" asChild className="mb-4">
          {/* Ideally, link back to the user's own profile page */}
          <Link href={`/`}> 
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <EditProfileForm />
      </div>
    </AppLayout>
  );
}
