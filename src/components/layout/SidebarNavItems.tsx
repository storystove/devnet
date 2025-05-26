"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Rocket, MessageSquare, Users, UserCircle, Settings } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/startups", label: "Startups", icon: Rocket },
  { href: "/rooms", label: "Rooms", icon: MessageSquare },
];

const userNavItems = (userId?: string) => [
  { href: `/profile/${userId}`, label: "Profile", icon: UserCircle, requireAuth: true },
  { href: "/profile/edit", label: "Settings", icon: Settings, requireAuth: true },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user } = useAuth();

  const allItems = [...navItems];
  if (user) {
    allItems.push(...userNavItems(user.uid));
  }


  return (
    <SidebarMenu>
      {allItems.map((item) => {
        if (item.requireAuth && !user) return null;
        
        const href = item.requireAuth && user ? item.href.replace('[userId]', user.uid) : item.href;

        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname === href}
              tooltip={{ children: item.label, side: "right", align: "center" }}
            >
              <Link href={href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
