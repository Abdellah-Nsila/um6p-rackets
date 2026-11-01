import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthApi } from "@/lib/api/auth";
import { authKeys } from "@/hooks/use-me";
import { broadcastAuthChange } from "./use-auth-sync";

// After login or register, put the user straight into the useMe cache
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
      broadcastAuthChange();
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AuthApi.register,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(authKeys.me, user);
      broadcastAuthChange();
    },
  });
}

// variables = { email }
export function useForgotPassword() {
  return useMutation({ mutationFn: AuthApi.forgotPassword });
}

// variables = { token, newPassword }
export function useResetPassword() {
  return useMutation({ mutationFn: AuthApi.resetPassword });
}
