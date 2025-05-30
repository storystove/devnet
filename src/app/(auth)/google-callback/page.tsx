
"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchCurrentUser } = useAuth(); // We need a way to signal AuthProvider to re-check auth
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast({
        title: 'Google Sign-In Failed',
        description: decodeURIComponent(error) || 'An error occurred during Google Sign-In.',
        variant: 'destructive',
      });
      router.replace('/signin');
      return;
    }

    if (token) {
      localStorage.setItem('authToken', token);
      // Signal AuthProvider to re-fetch user data with the new token
      fetchCurrentUser().then(() => {
        toast({ title: 'Signed in with Google successfully!' });
        // Check if user needs profile setup
        // This requires fetchCurrentUser to update the user object in AuthContext correctly
        // For now, assume a simple redirect to home or profile-setup if API/AuthProvider handles it
        // Ideally, your backend API after successful Google OAuth + user creation/login
        // would know if profile setup is needed and could include that in a response
        // or the fetchCurrentUser could update a user.profileSetupCompleted flag.
        // For now, we'll redirect to home.
        // A more advanced check would be to look at the user object from useAuth() after fetchCurrentUser completes.
        router.replace('/'); 
      }).catch(err => {
        toast({
            title: 'Sign-In Incomplete',
            description: 'Could not finalize sign-in. Please try again.',
            variant: 'destructive',
        });
        localStorage.removeItem('authToken');
        router.replace('/signin');
      });
    } else {
      // No token and no error, might be an unexpected state or direct navigation
      toast({
        title: 'Google Sign-In Issue',
        description: 'Could not retrieve authentication details from Google. Please try signing in again.',
        variant: 'destructive',
      });
      router.replace('/signin');
    }
  }, [router, searchParams, fetchCurrentUser, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg text-muted-foreground">Finalizing Google Sign-In...</p>
    </div>
  );
}
