"use client";

import { Card } from "../ui/card";
import { Trophy, MoveUpRight } from "lucide-react";
import Link from "next/link";
import { Leaderboard as LeaderboardType } from "@/types";
import LeaderboardRow from "@/components/leaderboard/leaderboard-row"; 

export default function Leaderboard({
  leaderboardData,
  clubSlug,
}: {
  leaderboardData: LeaderboardType[];
  clubSlug: string;
}) {
  // Sort members by rank or points to ensure top contenders appear first
  const sortedMembers = [...leaderboardData].sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return b.points - a.points;
  });

  return (
    <Card className="space-y-4 mt-6 w-full max-w-2xl mx-auto p-3 sm:p-6 bg-card rounded-3xl border border-border/70 shadow-2xs">
      <div className="text-xl sm:text-2xl px-2 sm:px-4 py-3 font-bold flex items-center justify-start gap-3 sm:gap-4 border-b border-gray-200">
        <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-accent shrink-0" />
        <span>Leaderboard</span>
      </div>

      <div className="w-full pb-2">
        <div className="flex flex-col gap-2 w-full p-1 sm:p-2">
          {sortedMembers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground italic font-semibold border border-dashed border-border rounded-xl">
              No ranked players found.
            </div>
          ) : (
            <>
              {/* Responsive Table Headers: Hidden on mobile (md:grid shows it only on desktop) */}
              <div className="hidden md:grid md:grid-cols-[60px_2.2fr_1fr_1fr_1fr_80px] gap-4 w-full px-6 py-2 mb-1 text-xs font-black text-muted-foreground italic tracking-widest border-b border-border">
                <div>RANK</div>
                <div className="truncate">ATHLETE</div>
                <div className="truncate">DEPT</div>
                <div className="truncate">RECORD</div>
                <div className="truncate">WIN RATE</div>
                <div className="text-right truncate">POINTS</div>
              </div>

              {/* Rows */}
              {sortedMembers.slice(0, 5).map((member) => (
                <LeaderboardRow
                  key={`mini-rank-${member.rank}-user-${member.player.id}`}
                  member={member}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <Link
        href={`/clubs/${clubSlug}/leaderboard`}
        className="flex flex-row justify-center items-center gap-2 p-3 sm:p-4 font-semibold hover:underline cursor-pointer text-sm sm:text-base border-t border-gray-100 text-accent"
      >
        <MoveUpRight className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
        <p>View Full Campus Ladder</p>
      </Link>
    </Card>
  );
}
