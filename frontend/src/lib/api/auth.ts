import { api, post, ApiError } from "./api";
import { getUrl } from "../utils";
import type { User } from "@/types/contracts/auth";
import {
  forgotPasswordPayload,
  loginPayload,
  registerPayload,
  resetPasswordPayload,
} from "@/types";

type AuthResponse = { user: User };

// Plain server calls only. Who is logged in is kept by the useMe query (hooks/use-me.ts).
export const AuthApi = {
  register: (payload: registerPayload) => post<AuthResponse>("/auth/register", payload),

  login: (payload: loginPayload) => post<AuthResponse>("/auth/login", payload),

  logout: () => post<void>("/auth/logout"),

  forgotPassword: (payload: forgotPasswordPayload) => post("/auth/forget-password", payload),

  resetPassword: (payload: resetPasswordPayload) =>
    post("/auth/reset-password", {
      token: payload.token,
      password: payload.newPassword,
    }),

  // Full page redirect (not an API call)
  oauthLogin: () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href =
      getUrl("/auth/google/login") + "?returnTo=" + encodeURIComponent(returnTo);
  },

  // The user, or null when not logged in
  getMe: async () => {
    try {
      const data = await api<AuthResponse>("/auth/me");
      return data.user ?? null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  checkLoginAvailable: (login: string) =>
    api<{ available: boolean }>(`/auth/login-available?login=${encodeURIComponent(login)}`),
};
