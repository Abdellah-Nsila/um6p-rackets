"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/hooks/use-me";
import { hasSessionHint } from "@/lib/utils";

const CHANNEL = "auth-sync";

export function broadcastAuthChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const ch = new BroadcastChannel(CHANNEL);
  ch.postMessage("auth-changed");
  ch.close();
}

export function useAuthSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);

    ch.onmessage = async () => {
      // 1. Cancel in-flight queries before they fail
      await queryClient.cancelQueries({ predicate: (q) => q.queryKey[0] !== authKeys.me[0] });

      if (!hasSessionHint()) {
        // 2. Set user to null FIRST so React unmounts protected components
        queryClient.setQueryData(authKeys.me, null);
      } else {
        // 2. Identity switch: refetch the new user
        queryClient.invalidateQueries({ queryKey: authKeys.me });
      }

      // 3. Now clear the private cache (components won't refetch because they just unmounted)
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== authKeys.me[0] });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (!hasSessionHint()) {
          queryClient.setQueryData(authKeys.me, null);
        } else {
          queryClient.invalidateQueries({ queryKey: authKeys.me });
        }
      }
    };
    
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      ch.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [queryClient]);
}