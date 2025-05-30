
"use client";

import type { User as FirebaseUser } from "firebase/auth"; // Keep for type structure if components expect it
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
// Remove direct Firebase auth imports if not used for other things
// import { auth, db } from "@/lib/firebase"; 
import type { UserProfile, Notification } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
// Remove Firestore imports if profile data comes solely from API
// import { collection, query, where, onSnapshot, Unsubscribe, getDocs, limit, orderBy, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiClient } from "@/lib/apiClient"; // Import the new API client
import { useRouter } from "next/navigation";

// Define a simpler User type for the API-based auth if FirebaseUser structure is not strictly needed.
// For now, we try to keep it compatible.
type AppUser = Partial<FirebaseUser> & UserProfile; // UserProfile is key from API

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  error: Error | null;
  signIn: (credentials: any) => Promise<void>;
  signUp: (details: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile | null>;
  uploadAvatar: (file: File) => Promise<{ avatarUrl?: string } | null>;
  fetchCurrentUser: () => Promise<void>; // To refresh user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  // const [initialNotificationCheckDone, setInitialNotificationCheckDone] = useState(false); // Notifications will depend on API now

  const fetchCurrentUser = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const profileData = await apiClient.get<UserProfile>('/api/profile', { useAuth: true });
        // Assuming API returns UserProfile structure, including 'id' which can serve as 'uid'
        const apiUser: AppUser = {
          ...profileData, // Spread UserProfile data
          uid: profileData.id, // Map API's 'id' to 'uid' for compatibility
          displayName: profileData.displayName,
          email: profileData.email,
          photoURL: profileData.avatarUrl,
          // Add other FirebaseUser-like properties if needed by components,
          // or refactor components to expect the new API user structure.
        };
        setUser(apiUser);
      } catch (err: any) {
        console.error("Failed to fetch current user from API or token invalid:", err.message);
        setUser(null);
        localStorage.removeItem('authToken'); // Clear invalid token
        setError(err);
      }
    } else {
      setUser(null); // No token, no user
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCurrentUser(true); // Fetch user on initial load
  }, [fetchCurrentUser]);

  // Notifications check would need to be adapted if API provides unread counts
  // useEffect(() => {
  //   if (user && !loading && !initialNotificationCheckDone) {
  //     // ... logic to fetch notifications from API ...
  //     // setInitialNotificationCheckDone(true);
  //   }
  // }, [user, loading, initialNotificationCheckDone, toast]);

  const signIn = async (credentials: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{ token: string; user: UserProfile }>('/api/signin', credentials);
      localStorage.setItem('authToken', response.token);
      // Map API user to AppUser
       const apiUser: AppUser = {
        ...response.user,
        uid: response.user.id,
        displayName: response.user.displayName,
        email: response.user.email,
        photoURL: response.user.avatarUrl,
      };
      setUser(apiUser);
      router.push("/"); // Redirect to home or dashboard
    } catch (err: any) {
      setError(err);
      setUser(null);
      throw err; // Re-throw for form to handle
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (details: any) => {
    setLoading(true);
    setError(null);
    try {
      // Assuming /api/signup might also return a token and user upon successful registration
      const response = await apiClient.post<{ token?: string; user: UserProfile }>('/api/signup', details);
       if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      // Map API user to AppUser
      const apiUser: AppUser = {
        ...response.user,
        uid: response.user.id,
        displayName: response.user.displayName,
        email: response.user.email,
        photoURL: response.user.avatarUrl,
      };
      setUser(apiUser); // Or fetch profile again if signup doesn't return full user/token
      router.push("/profile-setup"); // Redirect to profile setup
    } catch (err: any) {
      setError(err);
      setUser(null);
      throw err; // Re-throw for form to handle
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    // No specific /api/signout endpoint listed, so just clear client-side token
    localStorage.removeItem('authToken');
    setUser(null);
    setLoading(false);
    router.push("/signin");
    toast({ title: "Signed out successfully." });
  };
  
  const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile | null> => {
    if (!user) throw new Error("User not authenticated");
    setLoading(true);
    try {
      const updatedProfile = await apiClient.post<UserProfile>('/api/profile', profileData, { useAuth: true });
       setUser(prevUser => ({
        ...(prevUser || {}), // Keep existing FirebaseUser-like fields if any
        ...updatedProfile,  // Override with new profile data
        uid: updatedProfile.id, // Ensure uid is mapped
        displayName: updatedProfile.displayName,
        email: updatedProfile.email,
        photoURL: updatedProfile.avatarUrl,
      } as AppUser));
      toast({ title: "Profile updated!" });
      return updatedProfile;
    } catch (err: any) {
      toast({ title: "Profile update failed", description: err.message, variant: "destructive" });
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<{ avatarUrl?: string } | null> => {
    if (!user) throw new Error("User not authenticated");
    setLoading(true);
    const formData = new FormData();
    formData.append('profilePicture', file); // Assuming 'profilePicture' is the field name expected by /api/upload

    try {
      const response = await apiClient.post<{ avatarUrl: string }>('/api/upload', formData, { useAuth: true, isFormData: true });
      // After successful upload, update the user's profile with the new avatarUrl
      if (response.avatarUrl) {
        const updatedProfile = await updateProfile({ avatarUrl: response.avatarUrl });
        if (updatedProfile) {
          setUser(prev => ({...prev, ...updatedProfile, photoURL: updatedProfile.avatarUrl} as AppUser));
        }
      }
      toast({ title: "Avatar uploaded!" });
      return response;
    } catch (err: any) {
      toast({ title: "Avatar upload failed", description: err.message, variant: "destructive" });
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };


  if (loading && !user) { // Show loading skeleton only on initial load and if no user yet
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
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, updateProfile, uploadAvatar, fetchCurrentUser }}>
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
