import { UsersApi } from "@/lib/api/users";
import { UpdateProfileBody, UserProfile } from "@/types/contracts/users";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authKeys } from "./use-me";

export const profileKeys = {
  all: ["profiles"] as const,
  me: () => [...profileKeys.all, "me"] as const,
  detail: (id: number) => [...profileKeys.all, id] as const,
};

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => UsersApi.getMyProfile(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUserProfile(userId: number, initialData?: UserProfile) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => UsersApi.getUserProfile(userId),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000,
    initialData,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateProfileBody) => UsersApi.updateProfile(body),
    onSuccess: (data) => {
      toast.success("Profile updated successfully.");
      
      // Instantly update Navbar
      queryClient.setQueryData(authKeys.me, data.user);
      
      // Instantly update My Profile page cache
      queryClient.setQueryData(profileKeys.me(), (oldProfile: UserProfile | undefined) => 
        oldProfile ? { ...oldProfile, user: { ...oldProfile.user, ...data.user } } : oldProfile
      );

      // Instantly update generic detail cache
      queryClient.setQueryData(profileKeys.detail(data.user.id), (oldProfile: UserProfile | undefined) => 
        oldProfile ? { ...oldProfile, user: { ...oldProfile.user, ...data.user } } : oldProfile
      );

      // 4. Background refetch for complete safety
      return queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update profile."),
  });
}

export function useUserJoinedClubs(userId: number) {
  return useQuery({
    queryKey: [...profileKeys.detail(userId), "joinedClubs"],
    queryFn: () => UsersApi.getJoinedClubs(userId),
    enabled: Boolean(userId),
    staleTime: 10 * 60 * 1000,
  });
}
