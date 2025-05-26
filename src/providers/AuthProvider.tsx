"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      async (firebaseUser) => {
        if (firebaseUser) {
          // In a real app, you would fetch UserProfile data from Firestore here
          // For now, we'll just use the basic FirebaseUser and add some mock profile data
          const userWithProfile: FirebaseUser & Partial<UserProfile> = {
            ...firebaseUser,
            // Mock profile data, replace with actual Firestore fetch
            // displayName: firebaseUser.displayName || "Anonymous User",
            // avatarUrl: firebaseUser.photoURL,
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

    return () => unsubscribe();
  }, []);

  // Display a full-page loading skeleton if authentication state is still loading
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
