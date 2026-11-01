"use client";

import { useState } from "react";
import { Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

import { useUserMatches } from "@/hooks/use-matches";
import LeaderboardPagination from "../members/pagination";
import { User } from "@/types";

interface HistoryTabProps {
  userId: number;
  user: User;
}

const ITEMS_PER_PAGE = 3;

export default function HistoryTab({ userId, user }: HistoryTabProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    data: history,
    isLoading,
    isFetching,
  } = useUserMatches(userId, currentPage, ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 w-full h-full min-h-100">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-36 w-full bg-muted/40 animate-pulse rounded-2xl border border-border/40"
          />
        ))}
      </div>
    );
  }

  const matches = history?.data ?? [];
  const total = history?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (total === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/80 p-8 text-center text-muted-foreground italic font-semibold flex items-center justify-center min-h-100">
        No match history recorded yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full h-full min-h-100">
      <div
        className={cn(
          "flex-1 overflow-y-auto pr-1 sm:pr-2 flex flex-col gap-4 transition-opacity duration-200 pb-2",
          isFetching && !isLoading ? "opacity-60" : "opacity-100"
        )}
      >
        {matches.map((match) => {
          const dateFormatted = new Date(match.date).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });

          const isWin = match.result === "W";

          const scoreBoxClass = isWin
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
            : "bg-red-500/10 border-red-500/30 text-red-700";

          const pointsTextColor = isWin
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400";

          const pointsFormatted =
            match.points_change > 0 ? `+${match.points_change}` : match.points_change;

          const matchModeText = match.mode == 2 ? "Doubles" : "Singles";
          
          const myTeamNames = match.mode === 2 && match.partner 
            ? [user.login, match.partner.login] 
            : [user.login];
            
          const opponentTeamNames = match.opponents && match.opponents.length > 0 
            ? match.opponents.map((opp) => opp.login) 
            : ["Opponent"];

          return (
            <div
              key={match.match_id}
              className="p-4 sm:p-5 rounded-2xl bg-card flex flex-col gap-4 transition-colors border-2 border-border/50 hover:border-brand-orange/50 shadow-2xs overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
                
                <div className="flex flex-row lg:flex-col items-center lg:items-start justify-between w-full lg:w-auto gap-2 shrink-0 lg:min-w-28">
                  <div className="flex flex-row lg:flex-col items-center lg:items-start gap-2">
                    <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-bold text-xs border border-border/40 shrink-0 whitespace-nowrap uppercase tracking-wider">
                      {matchModeText}
                    </div>
                  </div>

                  <div className="flex lg:hidden items-center justify-center min-w-18 px-3.5 py-2 rounded-xl bg-background/50 border border-border/70 shadow-2xs shrink-0">
                    <span className={cn("font-black italic text-sm", pointsTextColor)}>
                      {pointsFormatted}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full min-w-0">
                  <div className="flex-1 flex flex-col gap-2 w-full min-w-0 justify-center">
                    {myTeamNames.map((name, index) => (
                      <div key={index} className="w-full p-2.5 sm:p-3 rounded-2xl border border-border/70 bg-background/50 flex items-center justify-center text-center overflow-hidden">
                        <div className="font-bold text-sm leading-snug text-foreground wrap-break-word w-full px-2" title={name}>
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={cn("px-4 py-2.5 sm:py-3 rounded-2xl border flex flex-col items-center justify-center shrink-0 min-w-24 sm:min-w-28 shadow-2xs self-center", scoreBoxClass)}>
                    <span className="font-black text-base sm:text-lg tracking-widest whitespace-nowrap">
                      {match.my_score} - {match.opponent_score}
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2 w-full min-w-0 justify-center">
                    {opponentTeamNames.map((name, index) => (
                      <div key={index} className="w-full p-2.5 sm:p-3 rounded-2xl border border-border/70 bg-background/50 flex items-center justify-center text-center overflow-hidden">
                        <div className="font-bold text-sm leading-snug text-foreground wrap-break-word w-full px-2" title={name}>
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 shrink-0 self-center">
                  <div className="flex items-center justify-center min-w-18 px-3.5 py-2 rounded-xl bg-background/50 border border-border/70 shadow-2xs">
                    <span className={cn("font-black italic text-sm", pointsTextColor)}>
                      {pointsFormatted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5 text-foreground font-medium uppercase tracking-wide min-w-0">
                  <Trophy className="w-3.5 h-3.5 text-brand-orange shrink-0" /> 
                  <span className="truncate">{match.club_name}</span>
                </span>
                <span className="shrink-0">•</span>
                <span className="flex items-center gap-1.5 font-medium shrink-0">
                  <Calendar className="w-3.5 h-3.5" /> {dateFormatted}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-auto shrink-0 pt-2">
          <div className="flex justify-center w-full bg-card border border-border/60 rounded-xl p-2 shadow-2xs">
            <LeaderboardPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
