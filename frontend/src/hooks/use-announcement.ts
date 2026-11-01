import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { clubKeys } from "@/hooks/use-clubs";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/lib/api/announcement";

export const announcementKeys = {
  all: (slug: string) => [...clubKeys.detail(slug), "announcements"] as const,
  lists: (slug: string) => [...announcementKeys.all(slug), "list"] as const,
};

export function useClubAnnouncements(slug: string, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.lists(slug),
    queryFn: async () => {
      if (!slug) return [];

      const annRes = await getAnnouncements(slug, 20, 1);
      const fetchedAnnouncements = annRes.data || [];

      return fetchedAnnouncements.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: enabled && Boolean(slug),
  });
}

export function useCreateAnnouncement(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (description: string) => createAnnouncement(slug, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all(slug) });
      toast.success("Announcement posted", {
        description: "Your new announcement is now live.",
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to post", {
        description: err.message || "An error occurred while creating the announcement.",
      });
    },
  });
}

export function useDeleteAnnouncement(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (announcementId: number) => deleteAnnouncement(slug, announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.all(slug) });
      toast.success("Announcement deleted", {
        description: "The announcement has been permanently removed.",
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to delete", {
        description: err.message || "An error occurred while deleting the announcement.",
      });
    },
  });
}
