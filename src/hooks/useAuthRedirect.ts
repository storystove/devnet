"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

interface UseAuthRedirectOptions {
  redirectToIfAuth?: string; // Redirect here if user IS authenticated
  redirectToIfNoAuth?: string; // Redirect here if user IS NOT authenticated
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user && options.redirectToIfAuth) {
      router.push(options.redirectToIfAuth);
    }

    if (!user && options.redirectToIfNoAuth) {
      router.push(options.redirectToIfNoAuth);
    }
  }, [user, loading, router, options]);

  return { user, loading };
}
