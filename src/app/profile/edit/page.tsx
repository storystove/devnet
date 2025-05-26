
"use client"; // Make this a client component

import { AppLayout } from "@/components/layout/AppLayout";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import type { Metadata } from 'next';
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider"; // Import useAuth

// Metadata should be defined outside if it needs to remain static,
// or generated dynamically if it depends on client-side data (though less common for edit pages).
// For now, we keep it simple as static. Consider removing if it causes issues with "use client".
// Next.js might handle this gracefully, but usually metadata is for server components.
// Let's assume for now it's fine, or can be moved/adjusted if needed.
// export const metadata: Metadata = {
// title: 'Edit Profile | DevNet',
// description: 'Update your DevNet profile information.',
// };
// If metadata needs to be dynamic and client-side, it would be set via document.title in a useEffect.
// For simplicity, we'll rely on a more static approach or a higher-level layout to set a generic title.


export default function EditProfilePage() {
  const { user: currentUser, loading: authLoading } = useAuth();

  // Determine the correct back link
  const backLink = currentUser && !authLoading ? `/profile/${currentUser.uid}` : "/";

  // It's generally better practice to handle metadata in server components or Layouts.
  // If "use client" is used, static metadata export here might not behave as expected in all Next.js versions.
  // For now, we'll focus on the functionality.
  // You might want to manage the title via a useEffect hook if it needs to be dynamic here:
  // useEffect(() => {
  //   document.title = 'Edit Profile | DevNet';
  // }, []);


  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={backLink}> 
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <EditProfileForm />
      </div>
    </AppLayout>
  );
}
