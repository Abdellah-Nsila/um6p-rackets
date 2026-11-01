import { useQuery } from "@tanstack/react-query";
import { AuthApi } from "@/lib/api/auth";

export const authKeys = { me: ["auth", "me"] as const };

const hasSessionHint = () => typeof document !== "undefined" && document.cookie.includes("logged_in=true");

// The current user: a User when logged in, null when not, undefined while loading
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    // CRITICAL FIX: Evaluate the hint INSIDE the function so it runs on every single fetch attempt
    queryFn: async () => {
      if (!hasSessionHint()) return null;
      return await AuthApi.getMe();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}