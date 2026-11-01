import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { clubKeys } from "@/hooks/use-clubs";
import {
  createSession,
  deleteSession,
  getClubSessions,
  joinSession,
  leaveSession,
  updateSession,
} from "@/lib/api/sessions";
import type { CreateSessionBody, UpdateSessionBody, WeekView } from "@/types/contracts/club";

// How often the spots left are refreshed while the page is open
const SESSIONS_REFRESH_MS = 15 * 1000;

export const sessionKeys = {
  all: (slug: string) => [...clubKeys.detail(slug), "sessions"] as const,
  week: (slug: string, week?: string) => [...sessionKeys.all(slug), week ?? "current"] as const,
};

export function useClubSessions(slug: string, week?: string) {
  return useQuery({
    queryKey: sessionKeys.week(slug, week),
    queryFn: () => getClubSessions(slug, week),
    enabled: Boolean(slug),
    refetchInterval: SESSIONS_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

// Update one session in a cached week, as if the server had already answered
function patchSession(old: WeekView | undefined, sessionId: number, joined: boolean) {
  if (!old) return old;
  const change = joined ? 1 : -1;

  return {
    ...old,
    sessions: old.sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            is_joined: joined,
            spots_left: Math.max(0, session.spots_left - change),
            attends_count: Math.max(0, session.attends_count + change),
          }
        : session,
    ),
  };
}

// Join and leave are the same mutation with opposite direction
function useAttendSession(slug: string, joined: boolean) {
  const queryClient = useQueryClient();
  const queryKey = sessionKeys.all(slug);

  return useMutation({
    mutationFn: (sessionId: number) =>
      joined ? joinSession(slug, sessionId) : leaveSession(slug, sessionId),

    // Optimistic update: the card changes at once, and is restored if the request fails
    onMutate: async (sessionId: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<WeekView>({ queryKey });
      queryClient.setQueriesData<WeekView>({ queryKey }, (old) =>
        patchSession(old, sessionId, joined),
      );
      return { previous };
    },
    onSuccess: () =>
      toast.success(joined ? "You have joined the session." : "You have left the session."),
    onError: (err: Error, _sessionId, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(err.message || (joined ? "Failed to join session." : "Failed to leave session."));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export const useJoinClubSession = (slug: string) => useAttendSession(slug, true);
export const useLeaveClubSession = (slug: string) => useAttendSession(slug, false);

export function useCreateSession(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateSessionBody) => createSession(slug, body),
    onSuccess: () => toast.success("Session created."),
    onError: (err: Error) => toast.error(err.message || "Failed to create session."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all(slug) }),
  });
}

// variables = { sessionId, body }
export function useUpdateSession(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, body }: { sessionId: number; body: UpdateSessionBody }) =>
      updateSession(slug, sessionId, body),
    onSuccess: () => toast.success("Session updated."),
    onError: (err: Error) => toast.error(err.message || "Failed to update session."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all(slug) }),
  });
}

// variables = { sessionId, applyToFuture }
export function useDeleteSession(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, applyToFuture }: { sessionId: number; applyToFuture: boolean }) =>
      deleteSession(slug, sessionId, applyToFuture),
    onSuccess: () => toast.success("Session cancelled."),
    onError: (err: Error) => toast.error(err.message || "Failed to cancel session."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all(slug) }),
  });
}
