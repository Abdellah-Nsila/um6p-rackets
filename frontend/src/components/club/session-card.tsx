"use client";

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CircleSmall, Clock, MapPin } from "lucide-react";
import { formatDayMonth, formatTime, formatWeekday } from "@/lib/date-utils";
import type { SessionView } from "@/types/contracts/club";
import DeleteSessionDialog from "./delete-session-dialog";
import EditSessionDialog from "./edit-session-dialog";
import SessionActionButton from "./session-action-button";

interface SessionCardProps {
  session: SessionView;
  clubSlug: string;
  isAdmin: boolean;
  onJoin: (session: SessionView) => void;
  onCancel: (sessionId: number) => void;
  isJoining: boolean;
  isCancelling: boolean;
}

export default function SessionCard({
  session,
  clubSlug,
  isAdmin,
  onJoin,
  onCancel,
  isJoining,
  isCancelling,
}: SessionCardProps) {
  const isFull = session.spots_left <= 0;

  return (
    <Card className="flex flex-col border border-border/75 shadow-sm hover:shadow-md transition-shadow bg-card p-4 sm:p-5 gap-3 sm:gap-4 rounded-xl relative overflow-hidden">
      <div className="flex justify-between items-start sm:items-center w-full">
        <Badge
          variant="outline"
          className="font-semibold text-accent border-accent/30 bg-accent-foreground/60 text-xs sm:text-sm px-3 py-1 shrink-0 rounded-full"
        >
          {formatWeekday(session.start_at)}, {formatDayMonth(session.start_at)}
        </Badge>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full font-medium mr-1">
            {/* The circle turns gray when the session is full */}
            <CircleSmall
              className={`w-4 h-4 shrink-0 ${isFull ? "text-muted-foreground" : "text-accent"}`}
              fill="currentColor"
            />
            <span>
              <strong className="text-foreground font-bold">{session.attends_count}</strong>
              <span className="opacity-75">/{session.capacity}</span>
            </span>
          </div>

          {isAdmin && (
            <>
              <EditSessionDialog session={session} clubSlug={clubSlug} />
              <DeleteSessionDialog session={session} clubSlug={clubSlug} />
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4 w-full sm:mt-1">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <h3 className="font-bold text-xl sm:text-2xl text-foreground leading-snug truncate">
            {session.title || "Session"}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium flex-wrap">
            <span className="flex items-center gap-1.5 shrink-0">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {formatTime(session.start_at)} - {formatTime(session.end_at)}
              </span>
            </span>
            {session.location && (
              <span className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{session.location}</span>
              </span>
            )}
          </div>
        </div>
        <div className="w-full sm:w-[110px] shrink-0">
          <SessionActionButton
            session={session}
            onJoin={onJoin}
            onCancel={onCancel}
            isJoining={isJoining}
            isCancelling={isCancelling}
          />
        </div>
      </div>
    </Card>
  );
}