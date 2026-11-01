// -> src/hooks/use-achievements.ts (replaces the previous version)
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { clubKeys } from "@/hooks/use-clubs";
import { ApiError } from "@/lib/api-error";
import {
  awardAchievement,
  deleteAchievement,
  getClubAchievements,
} from "@/lib/api/achievements";
import type { AchievementCode } from "@/types/contracts/achievement-code";

export const achievementKeys = {
  // all pages of the club feed: invalidate this one after award / delete
  club: (slug: string) => [...clubKeys.detail(slug), "achievements"] as const,
  clubPage: (slug: string, page: number, limit: number) =>
    [...achievementKeys.club(slug), { page, limit }] as const,
};

export function useClubAchievements(slug: string, page: number, limit = 10) {
  return useQuery({
    queryKey: achievementKeys.clubPage(slug, page, limit),
    queryFn: () => getClubAchievements(slug, page, limit),
    enabled: Boolean(slug),
    placeholderData: keepPreviousData, // no flicker when changing page
  });
}

export function useAwardAchievement(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { user_id: number; code: AchievementCode }) =>
      awardAchievement(slug, body),
    onSuccess: () => {
      toast.success("Achievement awarded.");
      return queryClient.invalidateQueries({ queryKey: achievementKeys.club(slug) });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError && err.status === 409
          ? "This member already has this achievement."
          : err.message || "Failed to award achievement.",
      ),
  });
}

// variables = the achievement id
export function useDeleteAchievement(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (achievementId: number) => deleteAchievement(slug, achievementId),
    onSuccess: () => {
      toast.success("Achievement removed.");
      return queryClient.invalidateQueries({ queryKey: achievementKeys.club(slug) });
    },
    onError: (err) => toast.error(err.message || "Failed to remove achievement."),
  });
}