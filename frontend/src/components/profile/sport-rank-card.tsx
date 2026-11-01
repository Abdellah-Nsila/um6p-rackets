"use client";

import { useState } from "react";
import Link from "next/link";
import { UserClubRank } from "@/types/contracts/club";
import { MoveUpRight } from "lucide-react";

interface SportRankCardProps {
  clubRanks: UserClubRank[];
  userId: number;
  userName: string;
  department?: string | null;
}

const sportsCatalog: Record<string, { name: string }> = {
  padel: { name: "Padel" },
  tennis: { name: "Tennis" },
  badminton: { name: "Badminton" },
  "table-tennis": { name: "Table Tennis" },
  squash: { name: "Squash" },
};

function normalizeSportKey(sport: string): string {
  const s = sport.toLowerCase().replace(/club/g, "").trim().replace(/\s+/g, "-");
  if (s.includes("padel")) return "padel";
  if (s.includes("tennis") && !s.includes("table")) return "tennis";
  if (s.includes("badminton")) return "badminton";
  if (s.includes("table") || s.includes("ping")) return "table-tennis";
  if (s.includes("squash")) return "squash";
  return s;
}


export default function SportRankCard({
  clubRanks,
  userId,
  userName,
  department,
}: SportRankCardProps) {
  const availableSports = (clubRanks || []).map((rank) => {
    const key = normalizeSportKey(rank.club_name);
    const catalogItem = sportsCatalog[key] || { name: rank.club_name };

    return {
      id: key,
      sport: rank.club_name,
      name: catalogItem.name,
      tabName: catalogItem.name,
      rankInfo: rank,
    };
  });

  const [selectedSport, setSelectedSport] = useState<string>(availableSports[0]?.id || "");

  if (availableSports.length === 0) {
    return (
      <div className="w-full flex flex-col rounded-2xl overflow-hidden shadow-xs border border-border/80 bg-card p-6 text-center">
        <h3 className="text-xl font-black italic text-brand-ink dark:text-white">Rank</h3>
        <p className="text-xs text-muted-foreground italic mt-2">
          No club rankings recorded for this athlete yet.
        </p>
        <Link
          href="/#clubs"
          className="mt-4 inline-flex items-center justify-center gap-1 text-xs font-bold italic text-brand-orange hover:underline"
        >
          <span>Explore Clubs</span>
          <MoveUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const currentSport = availableSports.find((s) => s.id === selectedSport) || availableSports[0];
  const currentRankInfo = currentSport.rankInfo;

  return (
    <div className="flex flex-col gap-3 w-full min-w-0 h-full">
      <div className="flex items-center gap-1 sm:gap-1.5 bg-card p-1 sm:p-1.5 rounded-xl border border-border/80 shadow-2xs w-full">
        {availableSports.map((sport) => {
          const isSelected = currentSport.id === sport.id;
          return (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              title={sport.name}
              className={`flex-1 min-w-0 px-1 sm:px-2 py-2 rounded-lg text-xs font-black tracking-widest transition-all cursor-pointer select-none truncate text-center ${
                isSelected
                  ? "bg-brand-orange text-white shadow-xs"
                  : "text-foreground font-extrabold hover:text-brand-orange hover:bg-muted/50"
              }`}
            >
              {sport.tabName}
            </button>
          );
        })}
      </div>

      <div className="w-full flex flex-col rounded-2xl shadow-xs border border-border/80 bg-card p-5 sm:p-6 gap-4">
        <div>
          <h2 className="text-2xl font-black italic text-brand-ink dark:text-white leading-none">
            Rank
          </h2>
          <p className="text-sm font-semibold italic text-muted-foreground mt-1.5">
            {currentSport.name} Club
          </p>
        </div>

        <div className="bg-secondary/50 dark:bg-[#121417] rounded-xl p-3.5 sm:p-4 flex items-center justify-between border border-border/60 dark:border-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-black italic flex items-center justify-center text-sm shrink-0 shadow-2xs">
              {currentRankInfo.rank}
            </div>

            <div className="min-w-0">
              <div className="font-bold italic text-sm sm:text-base text-brand-ink dark:text-white truncate">
                {userName}
              </div>
              <div className="text-xs font-semibold italic text-muted-foreground">
                Department {department || "Campus"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="font-black italic text-brand-orange text-base sm:text-lg leading-tight">
              {currentRankInfo.points.toLocaleString()}
            </span>
            <span className="text-[10px] font-black italic text-muted-foreground tracking-wider">
              PTS
            </span>
          </div>
        </div>

        <Link
          href={`/clubs/${currentRankInfo.club_slug}/leaderboard?target_user_id=${userId}`}
          className="flex items-center justify-center gap-1.5 pt-2 pb-1 text-xs sm:text-sm font-bold italic text-brand-ink dark:text-gray-200 hover:text-brand-orange dark:hover:text-brand-orange transition-colors cursor-pointer"
        >
          <span>View Leaderboard</span>
          <MoveUpRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
