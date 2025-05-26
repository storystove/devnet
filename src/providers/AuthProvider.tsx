
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@/lib/firebase"; // Added db
import type { UserProfile, Notification } from "@/types"; // Added Notification
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, onSnapshot, Unsubscribe, getDocs, limit, orderBy } from "firebase/firestore"; // Added Firestore imports
import { useToast } from "@/hooks/use-toast"; // Added useToast

interface AuthContextType {
  user: (FirebaseUser & Partial<UserProfile>) | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<(FirebaseUser & Partial<UserProfile>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const [initialNotificationCheckDone, setInitialNotificationCheckDone] = useState(false);


  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(
      async (firebaseUser) => {
        setInitialNotificationCheckDone(false); // Reset for new user session
        if (firebaseUser) {
          // Fetch UserProfile data from Firestore
          const userProfileRef = doc(db, "users", firebaseUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);
          let userProfileData: Partial<UserProfile> = {};
          if (userProfileSnap.exists()) {
            userProfileData = userProfileSnap.data() as UserProfile;
          }
          
          const userWithProfile: FirebaseUser & Partial<UserProfile> = {
            ...firebaseUser,
            ...userProfileData
          };
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribeAuth();
  }, []);


  useEffect(() => {
    if (user && !loading && !initialNotificationCheckDone) {
      const notificationsRef = collection(db, "users", user.uid, "notifications");
      const q = query(notificationsRef, where("read", "==", false), orderBy("timestamp", "desc"), limit(5)); // Check for a few recent unread

      getDocs(q).then((snapshot) => {
        if (!snapshot.empty) {
          const unreadCount = snapshot.size;
           toast({
            title: "New Notifications",
            description: `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.`,
            action: (
              <Button variant="outline" size="sm" asChild>
                <Link href="/notifications">View</Link>
              </Button>
            ),
          });
        }
        setInitialNotificationCheckDone(true);
      }).catch(err => {
        console.error("Error checking initial notifications:", err);
        setInitialNotificationCheckDone(true); // Still mark as done to prevent re-check
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, initialNotificationCheckDone, toast]); // Removed toast from deps to avoid loop, check if it has other implications. Added initialNotificationCheckDone


  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper to get user doc more easily
import { doc, getDoc } from "firebase/firestore";


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
