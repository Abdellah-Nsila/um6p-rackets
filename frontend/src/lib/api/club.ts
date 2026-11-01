import { api } from "@/lib/api/api";
import type {
  Club,
  ClubMemberStatus,
  ClubWithMembersCountAndCoachFullName,
} from "@/types/contracts/club";

const CLUBS = "/clubs";

export const getClubs = () => api<Club[]>(CLUBS);
export const getClub = (slug: string) =>
  api<ClubWithMembersCountAndCoachFullName>(`${CLUBS}/${slug}`);

// --- set of API functions for managing club memberships ---
export const getClubStatus = (slug: string) => api<ClubMemberStatus>(`${CLUBS}/${slug}/status`);

export const joinClub = (slug: string) =>
  api<{ status: "pending" }>(`${CLUBS}/${slug}/join`, { method: "POST" });

export const leaveClub = (slug: string) =>
  api<{ success: boolean; message: string }>(`${CLUBS}/${slug}/leave`, { method: "DELETE" });

export const cancelJoinRequest = (slug: string) =>
  api<{ success: boolean }>(`${CLUBS}/${slug}/join`, { method: "DELETE" });

export const updateClub = (slug: string, data: { name?: string; description?: string }) =>
  api<Club>(`${CLUBS}/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
