
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { Home, Rocket, MessageSquare as RoomIcon, Users, UserCircle, Settings, MessagesSquare, Bell } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/startups", label: "Startups", icon: Rocket },
  { href: "/rooms", label: "Rooms", icon: RoomIcon },
  { href: "/messages", label: "Messages", icon: MessagesSquare, requireAuth: true },
  { href: "/notifications", label: "Notifications", icon: Bell, requireAuth: true, hasBadge: true },
];

const userNavItems = (userId?: string) => [
  { href: `/profile/${userId}`, label: "Profile", icon: UserCircle, requireAuth: true },
  { href: "/profile/edit", label: "Settings", icon: Settings, requireAuth: true },
];


export function SidebarNavItems() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (user) {
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const q = query(notificationsRef, where("read", "==", false));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadNotifications(snapshot.size);
      }, (error) => {
        console.error("Error fetching unread notifications count:", error);
        setUnreadNotifications(0);
      });
    } else {
      setUnreadNotifications(0);
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const allItems = [...navItems];
  if (user) {
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

        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
        const showBadge = item.hasBadge && unreadNotifications > 0;

        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={{ children: item.label, side: "right", align: "center" }}
            >
              <Link href={href}>
                <item.icon />
                <span>{item.label}</span>
                {showBadge && <SidebarMenuBadge>{unreadNotifications}</SidebarMenuBadge>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
