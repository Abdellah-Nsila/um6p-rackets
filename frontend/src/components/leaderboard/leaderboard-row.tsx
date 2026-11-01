import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Leaderboard } from "@/types"; 

// Optimized mathematically since we now have true database integers
export function calculateWinRate(wins: number, total: number) {
  if (total === 0) return "0%";
  return `${Number(((wins / total) * 100).toFixed(1))}%`;
}

export default function LeaderboardRow({ member }: { member: Leaderboard }) {
  // Guard to prevent crashes if the API returns an empty/undefined slot
  if (!member || !member.player) return null;

  let rankBg = "bg-brand-ink text-background";
  let rowBg = "bg-brand-cream/20 hover:bg-muted";
  let cardBg = "bg-brand-cream/20 border-border hover:border-brand-orange/60";

  if (member.rank === 1) {
    rankBg = "bg-yellow-400 text-white";
    rowBg = "bg-orange-50 hover:bg-muted";
    cardBg = "bg-orange-50 border-amber-300/70 hover:border-amber-400";
  } else if (member.rank === 2) {
    rankBg = "bg-brand-teal text-white";
    rowBg = "bg-orange-50 hover:bg-muted";
    cardBg = "bg-orange-50 border-teal-300/70 hover:border-teal-400";
  } else if (member.rank === 3) {
    rankBg = "bg-accent text-white";
    rowBg = "bg-orange-50 hover:bg-muted";
    cardBg = "bg-orange-50 border-accent/40 hover:border-accent";
  }

  // Derive UI properties from the exact database statistics
  const fullName = `${member.player.first_name} ${member.player.last_name}`;
  const record = `${member.wins}W - ${member.losses}L`;
  const winRate = calculateWinRate(member.wins, member.total_matches);

  return (
    <>
      {/* Mobile Card View (< md) - Links to user profile */}
      <Link
        href={`/profile/${member.player.id}`}
        className={`md:hidden relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${cardBg}`}
      >
        {/* Header: Rank, Avatar, Name & Department, Points */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Rank Badge */}
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm shrink-0 ${rankBg}`}
            >
              {member.rank}
            </div>

            {/* Athlete Avatar */}
            <Avatar className="w-10 h-10 border-2 border-background shadow-xs shrink-0">
              <AvatarImage
                src={member.player.avatar || undefined}
                alt={fullName}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-brand-cream text-brand-orange font-bold text-sm">
                {fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Athlete Name & Department */}
            <div className="min-w-0">
              <div className="font-bold text-brand-ink italic text-sm truncate leading-tight group-hover:text-brand-orange">
                {fullName}
              </div>
              <div className="font-semibold text-muted-foreground italic text-xs truncate mt-0.5">
                {member.player.department || "N/A"}
              </div>
            </div>
          </div>

          {/* Points */}
          <div className="flex flex-col items-end shrink-0 pl-2">
            <span className="font-black italic text-brand-orange text-lg sm:text-xl leading-none pr-1">
              {member.points.toLocaleString()}
            </span>
            <span className="text-[10px] font-black text-muted-foreground italic tracking-widest mt-0.5">
              PTS
            </span>
          </div>
        </div>

        {/* Bottom Stats: Record and Win Rate */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-border/40">
          <div className="flex flex-col bg-background/70 rounded-lg px-3 py-1.5 border border-border/50">
            <span className="text-[9px] font-black text-muted-foreground italic tracking-wider">
              RECORD
            </span>
            <span className="font-bold text-brand-ink italic text-xs mt-0.5">{record}</span>
          </div>
          <div className="flex flex-col bg-background/70 rounded-lg px-3 py-1.5 border border-border/50">
            <span className="text-[9px] font-black text-muted-foreground italic tracking-wider">
              WIN RATE
            </span>
            <span className="font-bold text-brand-ink italic text-xs mt-0.5">{winRate}</span>
          </div>
        </div>
      </Link>

      {/* Desktop Row View (>= md) - Links to user profile */}
      <Link
        href={`/profile/${member.player.id}`}
        className={`hidden md:flex relative px-2 sm:px-6 py-2.5 sm:py-4 rounded-xl transition-all cursor-pointer hover:shadow-xs ${rowBg}`}
      >
        <div
          className="grid grid-cols-[35px_2fr_1fr_1fr_1fr_45px] sm:grid-cols-[60px_2.2fr_1fr_1fr_1fr_80px] items-center gap-1 sm:gap-4 w-full"
        >
          {/* Rank */}
          <div className="font-bold text-sm sm:text-lg">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-md ${rankBg}`}
            >
              {member.rank}
            </div>
          </div>

          {/* Athlete */}
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-hidden">
            <Avatar className="w-6 h-6 sm:w-10 sm:h-10 border-2 border-background shadow-sm shrink-0">
              <AvatarImage
                src={member.player.avatar || undefined}
                alt={fullName}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-brand-cream text-brand-orange font-bold text-[10px] sm:text-base">
                {fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-brand-ink italic text-[10px] sm:text-base truncate pr-1 sm:pr-3 hover:text-brand-orange transition-colors">
              {fullName}
            </span>
          </div>

          {/* Department */}
          <div className="font-bold text-muted-foreground italic text-[9px] sm:text-sm truncate">
            {member.player.department || "N/A"}
          </div>

          {/* Record & Win Rate */}
          <div className="font-bold text-muted-foreground italic text-[9px] sm:text-sm truncate">
            {record}
          </div>
          <div className="font-bold text-muted-foreground italic text-[9px] sm:text-sm truncate">
            {winRate}
          </div>

          {/* Points */}
          <div className="font-bold text-brand-orange italic text-right text-xs sm:text-lg pr-1">
            {member.points.toLocaleString()}
          </div>
        </div>
      </Link>
    </>
  );
}
