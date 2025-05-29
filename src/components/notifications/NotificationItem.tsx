
"use client";

import type { Notification } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, MessageCircle, UserPlus, ThumbsUp, MessageSquare, Rocket } from "lucide-react"; // Added Rocket
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'follow':
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    case 'dm':
      return <MessageCircle className="h-5 w-5 text-purple-500" />;
    case 'like':
      return <ThumbsUp className="h-5 w-5 text-red-500" />;
    case 'comment':
      return <MessageSquare className="h-5 w-5 text-green-500" />;
    case 'startup_join_request':
      return <Rocket className="h-5 w-5 text-orange-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationText = (notification: Notification): React.ReactNode => {
    const fromUser = <span className="font-semibold">{notification.fromUserDisplayName || "Someone"}</span>;
    const startupName = notification.startupName ? <span className="font-semibold">{notification.startupName}</span> : "a startup";
    switch (notification.type) {
        case 'follow':
          return <>{fromUser} started following you.</>;
        case 'dm':
          return <>{fromUser} sent you a message: <span className="italic text-muted-foreground">"{notification.messageSnippet}"</span></>;
        case 'startup_join_request':
          return <>{fromUser} requested to join your startup: {startupName}.</>;
        // Add cases for 'like', 'comment' when implemented
        default:
        return "You have a new notification.";
    }
};


export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const timeAgo = notification.timestamp ? formatDistanceToNow((notification.timestamp as Timestamp).toDate(), { addSuffix: true }) : "";

  return (
    <Link href={notification.link} onClick={onClick} legacyBehavior>
      <a className="block">
        <Card className={cn(
          "hover:bg-muted/50 transition-colors cursor-pointer",
          !notification.read && "bg-primary/5 border-primary/20"
        )}>
          <CardContent className="p-4 flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {notification.fromUserAvatarUrl ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={notification.fromUserAvatarUrl} alt={notification.fromUserDisplayName || ""} data-ai-hint="profile avatar" />
                  <AvatarFallback>{notification.fromUserDisplayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="p-2 bg-muted rounded-full">
                    {getNotificationIcon(notification.type)}
                </div>
              )}
            </div>
            <div className="flex-grow">
              <p className="text-sm leading-relaxed">
                {getNotificationText(notification)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
            </div>
            {!notification.read && (
              <div className="flex-shrink-0 self-center">
                <span className="h-2.5 w-2.5 bg-primary rounded-full block" title="Unread"></span>
              </div>
            )}
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}
