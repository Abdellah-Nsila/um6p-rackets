// -> src/lib/api/achievements.ts (replaces the previous version)
import { api, post } from "@/lib/api/api";
import type { Achievement, AchievementWithUser, Paginated } from "@/types/contracts/club";
import type { AchievementCode } from "@/types/contracts/achievement-code";

const CLUBS = "/clubs";
const ACHIEVEMENTS = "/achievements";

// Level: member. Newest first.
export const getClubAchievements = (slug: string, page = 1, limit = 10) =>
  api<Paginated<AchievementWithUser>>(`${CLUBS}/${slug}${ACHIEVEMENTS}?page=${page}&limit=${limit}`);

// Level: leader. user_id = auth-service id of an ACTIVE member.
// 409 = the user already has this code, 400 = unknown code.
// awarded_by is set by the server, never sent.
export const awardAchievement = (slug: string, body: { user_id: number; code: AchievementCode }) =>
  post<Achievement>(`${CLUBS}/${slug}${ACHIEVEMENTS}`, body);

// Level: leader. 204.
export const deleteAchievement = (slug: string, achievementId: number) =>
  api<void>(`${CLUBS}/${slug}${ACHIEVEMENTS}/${achievementId}`, {
    method: "DELETE",
  });
