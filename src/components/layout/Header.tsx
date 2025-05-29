
"use client";

import Image from "next/image";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserNav } from "@/components/auth/UserNav";
import Link from "next/link";

export function Header() {
  const { isMobile } = useSidebar();
  const logoUrl = "https://drive.google.com/uc?id=1XDpa3j14CoVRO6e9Gtv9enwq5FV7h_i1";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          {isMobile && <SidebarTrigger />}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src={logoUrl} 
              alt="DevNet Logo" 
              width={24} 
              height={24} 
              className="rounded-sm"
              data-ai-hint="application logo"
            />
            <span className="font-bold">DevNet</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
