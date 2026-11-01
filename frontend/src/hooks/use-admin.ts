import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { clubKeys } from "@/hooks/use-clubs";
import {
  createAdminClub,
  deleteAdminClub,
  deleteAdminUser,
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
} from "@/lib/api/admin";
import type {
  AdminListUsersQuery,
  AdminUpdateUserBody,
  CreateClubBody,
} from "@/types/contracts/admin";

// Everything lives under adminKeys.all, so one key clears all admin data.
export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  userList: (params: AdminListUsersQuery) =>
    [...adminKeys.users(), params] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  statsByWeeks: (weeks?: number) => [...adminKeys.stats(), { weeks }] as const,
};

export function useAdminUsers(params: AdminListUsersQuery = {}) {
  return useQuery({
    queryKey: adminKeys.userList(params),
    queryFn: () => getAdminUsers(params),
    placeholderData: keepPreviousData, // no flicker when changing page or filters
  });
}

export function useAdminStats(weeks?: number) {
  return useQuery({
    queryKey: adminKeys.statsByWeeks(weeks),
    queryFn: () => getAdminStats({ weeks }),
    placeholderData: keepPreviousData,
  });
}

// variables = { userId, body }
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, body }: { userId: number; body: AdminUpdateUserBody }) =>
      updateAdminUser(userId, body),
    onSuccess: () => {
      toast.success("User updated successfully.");
      return queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
    onError: (err) => toast.error(err.message || "Failed to update user."),
  });
}

// variables = the user id
export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => deleteAdminUser(userId),
    onSuccess: () => {
      toast.success("User deleted successfully.");
      // totals and members change, and a club may get a new coach
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: clubKeys.all }),
      ]);
    },
    onError: (err) => toast.error(err.message || "Failed to delete user."),
  });
}

export function useCreateAdminClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateClubBody) => createAdminClub(body),
    onSuccess: () => {
      toast.success("Club created successfully.");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() }),
        queryClient.invalidateQueries({ queryKey: clubKeys.all }),
      ]);
    },
    onError: (err) => toast.error(err.message || "Failed to create club."),
  });
}

// variables = the club slug
export function useDeleteAdminClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteAdminClub(slug),
    onSuccess: (_, slug) => {
      toast.success("Club deleted successfully.");
      queryClient.removeQueries({ queryKey: clubKeys.detail(slug) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() }),
        queryClient.invalidateQueries({ queryKey: clubKeys.all }),
      ]);
    },
    onError: (err) => toast.error(err.message || "Failed to delete club."),
  });
}