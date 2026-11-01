"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { useClubSessions, useJoinClubSession, useLeaveClubSession } from "@/hooks/use-sessions";
import { addDays, mondayOf, todayInAppZone } from "@/lib/date-utils";
import type { SessionView } from "@/types/contracts/club";
import SessionCard from "./session-card";
import CreateSessionDialog from "./create-session-dialog";

const INITIAL_VISIBLE_COUNT = 3;

// "Oct 19 – Oct 25, 2026" from a "YYYY-MM-DD" Monday
function formatWeekDisplay(weekStart?: string) {
  if (!weekStart) return "";
  const [year, month, day] = weekStart.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 6);

  const startText = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endText = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startText} – ${endText}`;
}

export function SessionsSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <Skeleton className="h-12 rounded-lg" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 sm:h-28 rounded-xl" />
      ))}
    </div>
  );
}

export default function SessionsList({
  clubSlug,
  isAdmin = false,
}: {
  clubSlug: string;
  isAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const weekQuery = searchParams.get("week") || undefined;
  const { data, isPending, isError, error, refetch } = useClubSessions(clubSlug, weekQuery);
  const joinSession = useJoinClubSession(clubSlug);
  const leaveSession = useLeaveClubSession(clubSlug);

  const currentWeekKey = data?.week_start || weekQuery || "current";
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const showAll = expandedWeek === currentWeekKey;

  // Past weeks can be opened for one year (52 weeks). The future stops at next week.
  // Both limits are enforced here, because the backend rejects weeks outside them.
  const thisMonday = mondayOf(todayInAppZone());
  const oldestWeek = addDays(thisMonday, -52 * 7);
  const newestWeek = addDays(thisMonday, 7);

  // Monday to Sunday, earliest first
  const sessions = [...(data?.sessions ?? [])].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );

  const visibleSessions = showAll ? sessions : sessions.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = sessions.length > INITIAL_VISIBLE_COUNT;

  const handleWeekChange = (newWeek?: string) => {
    setExpandedWeek(null);
    const params = new URLSearchParams(searchParams.toString());
    if (newWeek) params.set("week", newWeek);
    else params.delete("week");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  if (isPending) return <SessionsSkeleton />;

  if (isError) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center gap-3 border bg border-destructive/20 rounded-xl bg-destructive/5">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <div className="text-sm font-semibold text-destructive">Failed to load sessions</div>
        <p className="text-xs text-muted-foreground max-w-sm">{error.message}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const canGoBack = data.prev_week_start >= oldestWeek;
  const canGoForward = Boolean(data.next_week_start) && data.week_start < newestWeek;
  const isFutureWeek = data.week_start > thisMonday;

  return (
    <div className="flex-1 flex flex-col">
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <CreateSessionDialog clubSlug={clubSlug} />
        </div>
      )}

      <div>
        <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous week"
                onClick={() => handleWeekChange(data.prev_week_start)}
                disabled={!canGoBack}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {formatWeekDisplay(data.week_start)}
                </span>
                <div className="flex items-center gap-2">
                  {data.is_current_week ? (
                    <Badge className="bg-accent/15 text-accent text-[11px] font-medium border-transparent">
                      Current Week
                    </Badge>
                  ) : isFutureWeek ? (
                    <Badge
                      variant="outline"
                      className="border-accent/40 text-accent text-[11px] font-medium"
                    >
                      Future Week
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      Past Week
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next week"
                onClick={() => data.next_week_start && handleWeekChange(data.next_week_start)}
                disabled={!canGoForward}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {(!data.is_current_week || weekQuery) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleWeekChange(undefined)}
                className="text-xs text-accent hover:text-accent font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Current Week</span>
              </Button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed rounded-lg bg-card/50">
            <CalendarIcon className="w-8 h-8 text-muted-foreground/60" />
            <p className="font-medium text-sm text-foreground">No sessions scheduled</p>
            <p className="text-xs text-muted-foreground">
              There are no sessions scheduled for this week.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {visibleSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                clubSlug={clubSlug}
                isAdmin={isAdmin}
                onJoin={(s: SessionView) => joinSession.mutate(s.id)}
                onCancel={(sessionId) => leaveSession.mutate(sessionId)}
                // `variables` is the session id in progress: only that card shows the spinner
                isJoining={joinSession.isPending && joinSession.variables === session.id}
                isCancelling={leaveSession.isPending && leaveSession.variables === session.id}
              />
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="pt-6 pb-1 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedWeek(showAll ? null : currentWeekKey)}
            className="text-xs text-brand-orange hover:text-brand-orange/80 hover:bg-transparent p-0 h-auto font-semibold cursor-pointer inline-flex items-center gap-1"
          >
            {showAll ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Show more ({sessions.length - INITIAL_VISIBLE_COUNT} more)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
