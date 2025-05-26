
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { Notification } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, Unsubscribe, getDocs, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const NOTIFICATIONS_PER_PAGE = 15;

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVisibleNotification, setLastVisibleNotification] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLastVisibleNotification(null); // Reset for initial fetch

    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const q = query(
      notificationsRef, 
      orderBy("timestamp", "desc"), 
      limit(NOTIFICATIONS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(fetchedNotifications);
      if (snapshot.docs.length > 0) {
        setLastVisibleNotification(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMoreNotifications(false);
      }
      if (fetchedNotifications.length < NOTIFICATIONS_PER_PAGE) {
        setHasMoreNotifications(false);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setIsLoading(false);
      // Optionally show an error toast or message
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const fetchMoreNotifications = async () => {
    if (!user || !lastVisibleNotification || !hasMoreNotifications) return;

    setIsLoading(true); // Consider a different loading state for "load more"
    try {
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const q_more = query(
        notificationsRef,
        orderBy("timestamp", "desc"),
        startAfter(lastVisibleNotification),
        limit(NOTIFICATIONS_PER_PAGE)
      );
      const querySnapshot = await getDocs(q_more);
      const newNotifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      
      setNotifications(prev => [...prev, ...newNotifications]);
      if (querySnapshot.docs.length > 0) {
        setLastVisibleNotification(querySnapshot.docs[querySnapshot.docs.length - 1]);
      } else {
        setHasMoreNotifications(false);
      }
      if (newNotifications.length < NOTIFICATIONS_PER_PAGE) {
        setHasMoreNotifications(false);
      }
    } catch (error) {
      console.error("Error fetching more notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const handleNotificationClick = async (notificationId: string) => {
    if (!user) return;
    const notificationRef = doc(db, "users", user.uid, "notifications", notificationId);
    try {
      await updateDoc(notificationRef, { read: true });
      // Optimistic update in UI could be done here if desired
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (authLoading || (isLoading && notifications.length === 0)) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8 text-center">
          <p>Please sign in to view your notifications.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Your Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 && !isLoading ? (
              <div className="text-center py-10">
                <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-xl font-semibold">No Notifications Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We'll let you know when something new happens.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                ))}
              </div>
            )}
            {hasMoreNotifications && !isLoading && notifications.length > 0 && (
              <div className="mt-6 text-center">
                <Button onClick={fetchMoreNotifications} variant="outline">
                  Load More Notifications
                </Button>
              </div>
            )}
            {!hasMoreNotifications && notifications.length > 0 && (
               <p className="mt-6 text-center text-sm text-muted-foreground">No more notifications.</p>
            )}
             {isLoading && notifications.length > 0 && ( // Loading more indicator
              <div className="mt-6 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
