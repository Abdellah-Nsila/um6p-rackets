"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AuthApi } from "@/lib/api/auth";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/api";
import { authKeys } from "@/hooks/use-me";
import { broadcastAuthChange, useAuthSync } from "@/hooks/use-auth-sync";

// App-wide auth plumbing. Who is logged in lives only in useMe; this file only:
//   1. handles the return from Google login (?oauth=success)
//   2. marks the user as logged out when the session can no longer be renewed
export function AuthHydrator({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const isOauthSuccess = searchParams.get("oauth") === "success";

  useAuthSync();

  // 1. Return from Google login
  useEffect(() => {
    if (!isOauthSuccess) return;

    // The backend just set the cookies, so a cached "not logged in" answer is outdated
    queryClient
      .fetchQuery({ queryKey: authKeys.me, queryFn: AuthApi.getMe, staleTime: 0 })
      .catch(() => undefined) // if it fails, useMe will show the real state
      .finally(() => {
        broadcastAuthChange();
        // Remove ?oauth=success from the address bar
        const url = new URL(window.location.href);
        url.searchParams.delete("oauth");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      });
  }, [isOauthSuccess, queryClient]);

  // 2. Session expired: api() could not refresh the token
  useEffect(() => {
    const onExpired = () => queryClient.setQueryData(authKeys.me, null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [queryClient]);

  // TEMPORARY: remove keys the old auth store left in people's browsers (delete after a few weeks)
  useEffect(() => {
    try {
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("is_authenticated");
    } catch {
      // localStorage can be blocked: nothing to clean then
    }
  }, []);

  // Keep the spinner until the answer is in and the URL is clean
  if (isOauthSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  return <>{children}</>;
}
