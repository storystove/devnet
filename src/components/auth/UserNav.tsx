
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
// import { signOut as firebaseSignOut } from "firebase/auth"; // Firebase removed
// import { auth } from "@/lib/firebase"; // Firebase removed
import { LogOut, User, Settings, UserPlus, LogIn } from "lucide-react";
// import { useRouter } from "next/navigation"; // Handled by AuthProvider
import { useToast } from "@/hooks/use-toast";

export function UserNav() {
  const { user, loading, signOut } = useAuth(); // Get signOut from new AuthProvider
  // const router = useRouter(); // Handled by AuthProvider
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(); // Call API signOut
      // Toast is handled by signOut in AuthProvider if successful
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Error signing out.", variant: "destructive" });
    }
  };

  if (loading) {
    return <Button variant="ghost" size="sm">Loading...</Button>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/signin">
            <LogIn className="mr-2 h-4 w-4" /> Sign In
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/signup">
            <UserPlus className="mr-2 h-4 w-4" /> Sign Up
          </Link>
        </Button>
      </div>
    );
  }
  
  // User details now come from the API-hydrated user object in AuthProvider
  const userDisplayName = user.displayName || user.email?.split('@')[0] || "User";
  const userInitials = userDisplayName?.charAt(0).toUpperCase();
  const userAvatarUrl = user.photoURL || user.avatarUrl; // Prefer photoURL from Firebase-like structure, fallback to avatarUrl

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatarUrl || undefined} alt={userDisplayName || ""} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userDisplayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            {/* Ensure user.id or user.uid is available for the profile link */}
            <Link href={`/profile/${user.id || user.uid}`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile/edit">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
