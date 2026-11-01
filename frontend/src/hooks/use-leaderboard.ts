import { getClubLeaderboard } from "@/lib/api/leaderboard";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { clubKeys } from "./use-clubs";

export const leaderboardKeys = {
    all: (slug: string) => [...clubKeys.detail(slug), "leaderboard"] as const,
    clubLeaderboard: (slug: string, page: number, limit: number, target_user_id?: number) =>
      [...leaderboardKeys.all(slug), { page, limit, target_user_id }] as const,    
};

export function useClubLeaderboard(
  slug: string,
  page: number = 1,
  limit: number = 10,
  target_user_id?: number,
) {
  return useQuery({
    queryKey: leaderboardKeys.clubLeaderboard(slug, page, limit, target_user_id),
    queryFn: () => getClubLeaderboard(slug, page, limit, target_user_id),
    placeholderData: keepPreviousData, // Keeps previous page active while loading new page
    retry: false,
  });
}
