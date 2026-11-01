import { useQuery } from "@tanstack/react-query";
import { AuthApi } from "@/lib/api/auth";

const MIN_LOGIN_LENGTH = 3;

// Asks the backend if a username is free. Does nothing until it is long enough.
export function useLoginAvailable(login: string) {
  return useQuery({
    queryKey: ["auth", "login-available", login],
    queryFn: () => AuthApi.checkLoginAvailable(login),
    enabled: login.length >= MIN_LOGIN_LENGTH,
    staleTime: 30 * 1000,
    retry: false,
  });
}