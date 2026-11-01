import { api, post } from "@/lib/api/api";
import type {
  MatchDetail,
  MatchRequestBody,
  Paginated,
  UserHistoryMatch,
} from "@/types/contracts/club";

const CLUBS = "/clubs";

export const getPendingMatches = (slug: string) =>
  api<Paginated<MatchDetail>>(`${CLUBS}/${slug}/matches?status=pending&limit=50`);

export const acceptMatch = (slug: string, matchId: number) =>
  post<void>(`${CLUBS}/${slug}/matches/${matchId}/accept`);

export const requestMatch = (slug: string, body: MatchRequestBody) =>
  post<void>(`${CLUBS}/${slug}/matches/request`, body);

export const getClubMatches = (
  slug: string,
  mine: string | null,
  statusFilter: string,
  page: number,
  limit: number,
) => {
  const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
  const mineParam = mine ? `&mine=${mine}` : "";
  return api<Paginated<MatchDetail>>(
    `${CLUBS}/${slug}/matches?${mineParam}&page=${page}&limit=${limit}${statusParam}`,
  );
};

export const getUserMatches = (
  userId: number,
  page: number = 1,
  limit: number = 10,
): Promise<Paginated<UserHistoryMatch>> => {
  return api<Paginated<UserHistoryMatch>>(
    `/users/${userId}/matches?page=${page}&limit=${limit}`,
  );
}

export const cancelMatch = (slug: string, matchId: number) =>
  post<void>(`${CLUBS}/${slug}/matches/${matchId}/cancel`);

export const submitMatchResult = (
  slug: string,
  matchId: number,
  body: { team1_score: number; team2_score: number },
) => post<MatchDetail>(`${CLUBS}/${slug}/matches/${matchId}/result`, body);
