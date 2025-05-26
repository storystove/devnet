
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Rocket, MessageSquare as RoomIcon, Users, UserCircle, Settings, MessagesSquare } from "lucide-react"; // Changed MessageSquare to RoomIcon for clarity
import { useAuth } from "@/providers/AuthProvider";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/startups", label: "Startups", icon: Rocket },
  { href: "/rooms", label: "Rooms", icon: RoomIcon },
  { href: "/messages", label: "Messages", icon: MessagesSquare, requireAuth: true }, // New Messages Link
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
    // Add user-specific items that are not already in general nav
    userNavItems(user.uid).forEach(userItem => {
      if (!allItems.find(item => item.href === userItem.href && item.requireAuth)) {
        allItems.push(userItem);
      }
    });
  }


  return (
    <SidebarMenu>
      {allItems.map((item) => {
        if (item.requireAuth && !user) return null;
        
        const href = item.requireAuth && user && item.href.includes('[userId]') 
          ? item.href.replace('[userId]', user.uid) 
          : item.href;

        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname === href || (href !== "/" && pathname.startsWith(href))} // More robust active check for nested routes
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
