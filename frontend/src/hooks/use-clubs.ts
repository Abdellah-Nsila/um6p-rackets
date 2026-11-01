import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelJoinRequest,
  getClub,
  getClubs,
  getClubStatus,
  joinClub,
  leaveClub,
  updateClub,
} from "@/lib/api/club";
import { useMe } from "./use-me";

export const clubKeys = {
  all: ["clubs"] as const,
  detail: (slug: string) => ["clubs", slug] as const,
  status: (slug: string, userId?: number) => ["clubs", slug, "status", userId] as const,
};

export function useClubs() {
  return useQuery({
    queryKey: clubKeys.all,
    queryFn: getClubs,
    staleTime: 10 * 60 * 1000,
  });
}

export function useClub(slug: string) {
  return useQuery({
    queryKey: clubKeys.detail(slug),
    queryFn: () => getClub(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}

export function useClubStatus(slug: string) {
  const { data: user } = useMe();

  return useQuery({
    queryKey: clubKeys.status(slug, user?.id),
    queryFn: () => getClubStatus(slug),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(slug) && Boolean(user),
  });
}

export function useJoinClub(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => joinClub(slug),
    onSuccess: () => {
      toast.success("Join request sent");
      return queryClient.invalidateQueries({ queryKey: clubKeys.detail(slug) });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to send join request."),
  });
}

// ==========================================
// NEW: Update Club Hook (No `any`)
// ==========================================
export function useUpdateClub(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) => updateClub(slug, data),
    onSuccess: () => {
      toast.success("Club updated successfully!");
      queryClient.invalidateQueries({ queryKey: clubKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: clubKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update club information.");
    },
  });
}

export function useCancelJoinClub(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelJoinRequest(slug),
    onSuccess: () => {
      toast.success("Join request cancelled");
      return queryClient.invalidateQueries({ queryKey: clubKeys.detail(slug) });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to cancel join request."),
  });
}

export function useLeaveClub(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      return leaveClub(slug);
    },
    onSuccess: (result: { success: boolean; message: string }) => {
      if (!result.success) {
        toast.error(result.message || "Failed to leave the club.");
        return;
      }
      toast.success(result.message || "You have left the club.");
      return queryClient.invalidateQueries({ queryKey: clubKeys.detail(slug) });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to leave club."),
  });
}
