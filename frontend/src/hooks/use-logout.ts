// "use client";

// import { useQueryClient } from "@tanstack/react-query";
// import { useRouter } from "next/navigation";
// import { AuthApi } from "@/lib/api/auth";
// import { authKeys } from "@/hooks/use-me";

// import { broadcastAuthChange } from "@/hooks/use-auth-sync";

// export function useLogout() {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   return async () => {
//     try {
//       await AuthApi.logout();
//     } catch {
//     } finally {
//       // force front-end logout regardless
//       queryClient.setQueryData(authKeys.me, null);
//       queryClient.resetQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] });

//       broadcastAuthChange();

//       router.push("/");
//     }
//   };
// }

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthApi } from "@/lib/api/auth";
import { authKeys } from "@/hooks/use-me";
import { broadcastAuthChange } from "@/hooks/use-auth-sync";

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    try {
      await AuthApi.logout();
    } catch {
      // force client-side logout regardless
    } finally {
      // 1. Cancel any in-flight private queries before they return 401
      await queryClient.cancelQueries({
        predicate: (q) => q.queryKey[0] !== authKeys.me[0],
      });
      // 2. Mark logged out in the cache
      queryClient.setQueryData(authKeys.me, null);
      // 3. Remove private data so the next user doesn't see stale results
      queryClient.removeQueries({
        predicate: (q) => q.queryKey[0] !== authKeys.me[0],
      });
      // 4. Tell other tabs
      broadcastAuthChange();
      // 5. Navigate: components unmount, no more refetches
      router.push("/");
    }
  };
}
