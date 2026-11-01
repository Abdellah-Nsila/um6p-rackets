import { ClubLeaderboard } from "@/types";
import { api } from "./api";

const CLUBS = "/clubs";

export const getClubLeaderboard = (
  slug: string,
  page: number = 1,
  limit: number = 10,
  target_user_id?: number,
) : Promise<ClubLeaderboard> => {
  return api<ClubLeaderboard>(
    `${CLUBS}/${slug}/leaderboard?page=${page}&limit=${limit}${target_user_id ? `&target_user_id=${target_user_id}` : ""}`,
  );
};
