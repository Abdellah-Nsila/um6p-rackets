import { api } from "@/lib/api/api";
import { todayInAppZone } from "@/lib/date-utils";
import type {
  CreateSessionBody,
  SessionView,
  UpdateSessionBody,
  WeekView,
} from "@/types/contracts/club";

const CLUBS = "/clubs";

// week = a "YYYY-MM-DD" date inside the week you want (default: today)
export const getClubSessions = (slug: string, week?: string) =>
  api<WeekView>(
    `${CLUBS}/${slug}/sessions?week=${encodeURIComponent(week ?? todayInAppZone())}`,
  );

export const joinSession = (slug: string, sessionId: number) =>
  api<{ success: boolean }>(`${CLUBS}/${slug}/sessions/${sessionId}/attend`, { method: "POST" });

export const leaveSession = (slug: string, sessionId: number) =>
  api<{ success: boolean }>(`${CLUBS}/${slug}/sessions/${sessionId}/attend`, {
    method: "DELETE",
  });

export const createSession = (slug: string, body: CreateSessionBody) =>
  api<SessionView[]>(`${CLUBS}/${slug}/sessions`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateSession = (slug: string, sessionId: number, body: UpdateSessionBody) =>
  api<unknown>(`${CLUBS}/${slug}/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const deleteSession = (slug: string, sessionId: number, applyToFuture = false) =>
  api<void>(
    `${CLUBS}/${slug}/sessions/${sessionId}${applyToFuture ? "?apply_to_future=true" : ""}`,
    { method: "DELETE" },
  );