import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MemberRole, type MemberWithUser } from "@/types/contracts/club";

// Label and colors for each role
const ROLE_BADGES = {
  [MemberRole.MEMBER]: { label: "MEMBER", className: "bg-green-100 text-green-700" },
  [MemberRole.LEADER]: { label: "LEADER", className: "bg-purple-100 text-purple-700" },
  [MemberRole.COACH]: { label: "COACH", className: "bg-blue-100 text-blue-700" },
};

export default function MembersRow({ member }: { member: MemberWithUser }) {
  const rowBg = "bg-brand-cream/20 hover:bg-muted";
  const cardBg = "bg-brand-cream/20 border-border hover:border-brand-orange/60";

  const joinDate = new Date(member.joined_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  });

  // Seeded users can have no first or last name: fall back to the login
  const fullName = `${member.user.first_name ?? ""} ${member.user.last_name ?? ""}`.trim();
  const displayName = fullName || member.user.login;
  const initial = displayName.charAt(0).toUpperCase();

  const badge = ROLE_BADGES[member.role] ?? ROLE_BADGES[MemberRole.MEMBER];
  const roleBadge = (
    <span className={`${badge.className} px-2 py-1 rounded-md text-[10px] font-black italic`}>
      {badge.label}
    </span>
  );
  return (
    <>
      {/* Mobile Card View (< md) */}
      <Link
        href={`/profile/${member.user.id}`}
        className={`md:hidden relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-md ${cardBg}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-12 h-12 border-2 border-background shadow-xs shrink-0">
              <AvatarImage
                src={member.user.avatar || undefined}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-brand-cream text-brand-orange font-bold text-sm">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div
                className="font-bold text-brand-ink italic text-sm truncate leading-tight hover:text-brand-orange"
                title={displayName}
              >
                {displayName}
              </div>
              <div
                className="font-semibold text-muted-foreground italic text-xs truncate mt-0.5 hover:text-brand-orange"
                title={`@${member.user.login}`}
              >
                @{member.user.login}
              </div>
              <div
                className="font-semibold text-muted-foreground italic text-[10px] truncate mt-0.5"
                title={member.user.department || "No Dept"}
              >
                {member.user.department || "No Dept"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 pl-2">{roleBadge}</div>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-3 pt-2.5 border-t border-border/40">
          <div className="flex justify-between items-center bg-background/70 rounded-lg px-3 py-2 border border-border/50">
            <span className="text-[9px] font-black text-muted-foreground italic tracking-wider">
              JOINED DATE
            </span>
            <span className="font-bold text-brand-ink italic text-xs">{joinDate}</span>
          </div>
        </div>
      </Link>

      {/* Desktop Row View (>= md) */}
      <Link
        href={`/profile/${member.user.id}`}
        className={`hidden md:flex relative flex-col justify-center px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl transition-all cursor-pointer hover:shadow-xs ${rowBg}`}
      >
        <div className="grid grid-cols-[90px_2fr_1fr_1.5fr_1fr] items-center gap-4 w-full">
          {/* Role */}
          <div className="font-bold text-sm shrink-0">{roleBadge}</div>

          {/* Member Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-background shadow-sm shrink-0">
              <AvatarImage
                src={member.user.avatar || undefined}
                alt={displayName}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="bg-brand-cream text-brand-orange font-bold text-xs sm:text-base">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span
              className="font-bold text-brand-ink italic text-xs sm:text-base truncate pr-2 sm:pr-3 hover:text-brand-orange transition-colors"
              title={displayName}
            >
              {displayName}
            </span>
          </div>

          {/* Login (Added min-w-0 and title) */}
          <div
            className="font-bold text-muted-foreground italic text-[11px] sm:text-sm truncate min-w-0"
            title={`@${member.user.login}`}
          >
            @{member.user.login}
          </div>

          {/* Department (Added min-w-0 and title) */}
          <div
            className="font-bold text-muted-foreground italic text-[11px] sm:text-sm truncate min-w-0"
            title={member.user.department || "No Dept"}
          >
            {member.user.department || "-"}
          </div>

          {/* Joined Date */}
          <div className="font-bold text-muted-foreground italic text-[11px] sm:text-sm truncate min-w-0">
            {joinDate}
          </div>
        </div>
      </Link>
    </>
  );
}
