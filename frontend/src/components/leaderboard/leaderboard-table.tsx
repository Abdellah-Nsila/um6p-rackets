"use client";

import LeaderboardRow from "./leaderboard-row";
import Pagination from "./pagination";
import { Leaderboard } from "@/types"; // Adjust based on your types location

interface LeaderboardTableProps {
  leaderboardData: Leaderboard[];
  targetUserRow: Leaderboard | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export default function LeaderboardTable({
  leaderboardData,
  targetUserRow,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading,
}: LeaderboardTableProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="w-full max-w-6xl bg-card shadow-sm rounded-xl sm:rounded-2xl p-3 sm:p-8 border border-border">
      <div className="mb-4 px-2">
        <p className="text-[10px] sm:text-xs text-muted-foreground italic mt-1">
          Active campus contenders ranked by performance.
        </p>
      </div>

      <div
        className={`w-full md:overflow-x-auto md:pb-4 scrollbar-thin transition-opacity duration-200 ${isLoading ? "opacity-50" : "opacity-100"}`}
      >
        <div className="w-full md:min-w-42.5">
          {/* Table Headers */}
          <div className="hidden md:grid grid-cols-[60px_2.2fr_1fr_1fr_1fr_80px] gap-4 w-full px-4 sm:px-6 py-3 mb-2 text-[9px] sm:text-xs font-black text-muted-foreground italic tracking-widest border-b border-border">
            <div>RANK</div>
            <div>ATHLETE</div>
            <div>DEPARTMENT</div>
            <div>RECORD</div>
            <div>WIN RATE</div>
            <div className="text-right">POINTS</div>
          </div>

          {/* Main Paginated List */}
          <div className="flex flex-col gap-3 md:gap-2">
            {leaderboardData.length === 0 && !isLoading ? (
              <div className="p-8 text-center text-muted-foreground italic font-semibold border border-dashed border-border rounded-xl">
                No ranked players found.
              </div>
            ) : (
              leaderboardData.map((member) => (
                <LeaderboardRow
                  key={`rank-${member.rank}-user-${member.player.id}`}
                  member={member}
                />
              ))
            )}
          </div>

          {/* Sticky Target User Row */}
          {targetUserRow && (
            <div className="mt-6 pt-4 border-t-2 border-border/80 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-card px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest z-10">
                Target Athlete
              </div>

              <div className="p-0.5 border-2 border-brand-orange/60 rounded-[14px] overflow-hidden shadow-md">
                <LeaderboardRow member={targetUserRow} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="mt-4 sm:mt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-2 sm:px-4 text-[10px] sm:text-xs font-bold text-muted-foreground italic">
          <p className="text-center md:text-left">
            Displaying {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of{" "}
            {totalItems} active contenders
          </p>

          <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
