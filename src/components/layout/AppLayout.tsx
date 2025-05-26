"use client";

import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavItems } from "./SidebarNavItems";
import { Header } from "./Header"; // Assuming UserNav is part of Header or handled separately
import Link from "next/link";
import { Button } from "../ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed out successfully." });
      router.push("/signin");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Error signing out.", variant: "destructive" });
    }
  };
  
  return (
    <SidebarProvider defaultOpen>
      <SidebarHoistable>
        <Sidebar className="flex flex-col" variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
             <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">CollabForge</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-1 p-2">
            <SidebarNavItems />
          </SidebarContent>
          {user && (
            <SidebarFooter className="p-2">
               <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
                <span className="group-data-[collapsible=icon]:hidden">Log Out</span>
              </Button>
            </SidebarFooter>
          )}
        </Sidebar>
        <SidebarInset className="flex flex-col">
           <Header />
           <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
           </main>
        </SidebarInset>
      </SidebarHoistable>
       <SidebarRail />
    </SidebarProvider>
  );
}

// Helper component to hoist Sidebar and SidebarInset as direct children of SidebarProvider
function SidebarHoistable({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
