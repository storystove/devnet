
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/types';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface UserSearchResultItemProps {
  user: UserProfile;
}

export function UserSearchResultItem({ user }: UserSearchResultItemProps) {
  const displayName = user.displayName || user.email?.split('@')[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/profile/${user.id}`} className="flex items-center gap-3 group flex-grow min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || undefined} alt={displayName} data-ai-hint="profile avatar" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">{displayName}</p>
              {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
            </div>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/profile/${user.id}`}>
              View Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
