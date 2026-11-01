import { JoinedClub, UpdateProfileBody, User, UserProfile } from "@/types";
import { api } from "./api";

export const UsersApi = {
  // Fetch the currently logged-in user's complete profile
  getMyProfile: () => api<UserProfile>("/users/me/profile"),

  // Fetch a public user's profile by their ID
  getUserProfile: (userId: number) => api<UserProfile>(`/users/${userId}/profile`),

  getJoinedClubs: (userId: number) => api<JoinedClub[]>(`/users/${userId}/memberships`),

  updateProfile: (body: UpdateProfileBody) =>
    api<{ user: User }>(`/users/me`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
