"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserProfile } from "@/types";
import { Mail, Link as LinkIcon, Briefcase, Languages, Users, UserCheck, Edit3 } from "lucide-react";
import Link from "next/link";

interface ProfileDisplayProps {
  profile: UserProfile;
  isCurrentUser?: boolean;
}

export function ProfileDisplay({ profile, isCurrentUser = false }: ProfileDisplayProps) {
  const displayName = profile.displayName || profile.email?.split('@')[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-muted/30 p-6 border-b">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 text-3xl border-2 border-background shadow-md">
            <AvatarImage src={profile.avatarUrl || undefined} alt={displayName} data-ai-hint="profile avatar large" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left flex-1">
            <CardTitle className="text-3xl font-bold">{displayName}</CardTitle>
            {profile.email && (
              <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start mt-1">
                <Mail className="mr-2 h-4 w-4" /> {profile.email}
              </p>
            )}
             <div className="mt-3 flex items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center"><Users className="mr-1 h-4 w-4" /> {profile.followerCount || 0} Followers</span>
                <span className="flex items-center"><UserCheck className="mr-1 h-4 w-4" /> {profile.followingCount || 0} Following</span>
            </div>
          </div>
          {isCurrentUser && (
            <Button asChild variant="outline">
              <Link href="/profile/edit">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {profile.bio && (
          <div>
            <h3 className="text-lg font-semibold mb-1">Bio</h3>
            <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
            </div>
          </div>
        )}

        {profile.preferredLanguages && profile.preferredLanguages.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><Languages className="mr-2 h-5 w-5 text-primary" />Preferred Languages</h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredLanguages.map(lang => <Badge key={lang} variant="secondary">{lang}</Badge>)}
            </div>
          </div>
        )}

        {profile.externalLinks && profile.externalLinks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><LinkIcon className="mr-2 h-5 w-5 text-primary" />Links</h3>
            <ul className="space-y-1">
              {profile.externalLinks.map(link => (
                <li key={link.name} className="text-sm">
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                    {link.name} <ExternalLink className="ml-1 h-3 w-3"/>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Placeholder for Joined Startups */}
         <div>
            <h3 className="text-lg font-semibold mb-2">Joined Startups</h3>
            {profile.joinedStartups && profile.joinedStartups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {profile.joinedStartups.map(startupId => (
                        <Card key={startupId} className="p-2 text-sm">
                           <Link href={`/startups/${startupId}`} className="hover:text-primary font-medium">Startup {startupId.substring(0,4)}...</Link>
                        </Card>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">Not part of any startups yet.</p>}
         </div>

      </CardContent>
      {!isCurrentUser && (
         <CardFooter className="border-t p-4">
            <Button className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" /> Follow {displayName}
            </Button>
         </CardFooter>
      )}
    </Card>
  );
}
