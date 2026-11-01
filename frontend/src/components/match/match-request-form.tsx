"use client";

// -> src/components/match/match-request-form.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRequestMatch } from "@/hooks/use-matches";
import { MatchMode, type MatchRequestBody } from "@/types/contracts/club";

import MatchDisciplineCard from "./match-discipline-card";
import MatchPlayerCard from "./match-player-card";
import MatchDateTimeSection from "./match-datetime-section";
import MemberSearchModal from "./member-search-modal";
import { now } from "@/lib/date-utils";

// One chosen member (replaces the 8 parallel id/name/dept/avatar states)
type Picked = { id: number; name: string; dept: string; avatar: string | null };
type Target = "partner" | "opponent_1" | "opponent_2";

export default function MatchRequestForm({
  clubSlug,
  currentMemberId,
  currentUserName,
  currentUserAvatar,
}: {
  clubSlug: string;
  currentMemberId: number;
  currentUserName: string;
  currentUserDepartment?: string | null;
  currentUserAvatar?: string | null;
}) {
  const router = useRouter();
  const request = useRequestMatch(clubSlug);

  const [matchMode, setMatchMode] = useState<MatchMode>(MatchMode.SINGLES);
  const [partner, setPartner] = useState<Picked | null>(null);
  const [opponents, setOpponents] = useState<[Picked | null, Picked | null]>([null, null]);

  const [matchDate, setMatchDate] = useState<Date>(now());
  const [startTime, setStartTime] = useState("17:00");
  const [location, setLocation] = useState("");

  const [activeTarget, setActiveTarget] = useState<Target | null>(null);

  const handleSelectMember = (
    id: number,
    name: string,
    department: string,
    avatar: string | null,
  ) => {
    const picked: Picked = {
      id,
      name,
      dept: department.trim() !== "" ? department : "Sport Department",
      avatar,
    };

    if (activeTarget === "partner") setPartner(picked);
    if (activeTarget === "opponent_1") setOpponents((prev) => [picked, prev[1]]);
    if (activeTarget === "opponent_2") setOpponents((prev) => [prev[0], picked]);
    setActiveTarget(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isDoubles = matchMode === MatchMode.DOUBLES;

    if (isDoubles && !partner) {
      toast.error("Please select a partner for doubles match.");
      return;
    }

    const required = isDoubles ? 2 : 1;
    const chosen = opponents.slice(0, required).filter((o): o is Picked => o !== null);
    if (chosen.length < required) {
      toast.error(`Please select ${required} opponent(s).`);
      return;
    }

    const [hours, minutes] = startTime.split(":").map(Number);

    // 1. Create a true copy of the date to avoid mutating React state
    const scheduledAt = new Date(matchDate.getTime());

    // 2. Force the time using UTC methods to completely bypass the browser's GMT+0100
    scheduledAt.setUTCHours(hours, minutes, 0, 0);

    // Now log the safe UTC string instead of the raw browser Date object

    if (scheduledAt < now()) {
      toast.error("Match scheduled time must be in the future.");
      return;
    }

    const payload: MatchRequestBody = {
      mode: matchMode,
      partner_id: isDoubles ? partner?.id : undefined,
      opponent_ids: chosen.map((o) => o.id),
      location: location.trim() || undefined,
      scheduled_at: scheduledAt.toISOString(),
    };

    request.mutate(payload, {
      onSuccess: () => router.push(`/clubs/${clubSlug}`),
    });
  };

  const excludedIds = [currentMemberId, partner?.id, opponents[0]?.id, opponents[1]?.id].filter(
    (id): id is number => id !== undefined,
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black italic tracking-tight text-foreground">
          Schedule A <span className="text-brand-orange">Match</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Challenge fellow campus athletes, set your match format, and climb the UM6P Elo ladder on
          official campus courts.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-8 bg-card border border-border/70 rounded-3xl p-6 sm:p-8 shadow-sm"
      >
        {/* Step 1: Select Discipline */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-bold flex items-center justify-center text-sm">
              1
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Select Match Discipline</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <MatchDisciplineCard
              mode={MatchMode.SINGLES}
              currentMode={matchMode}
              title="Solo Match"
              onSelect={() => {
                setMatchMode(MatchMode.SINGLES);
                setPartner(null);
                setOpponents((prev) => [prev[0], null]);
              }}
            />
            <MatchDisciplineCard
              mode={MatchMode.DOUBLES}
              currentMode={matchMode}
              title="Duo Match"
              onSelect={() => setMatchMode(MatchMode.DOUBLES)}
            />
          </div>
        </div>

        {/* Step 2: Select Players & Teams */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-bold flex items-center justify-center text-sm">
              2
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Select Players & Teams</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 relative">
            {/* Team 1 • Your Side */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground italic">
                Team 1 • Your Side
              </span>

              <MatchPlayerCard
                name={currentUserName}
                avatarUrl={currentUserAvatar}
              />

              {matchMode === MatchMode.DOUBLES && (
                <MatchPlayerCard
                  type="empty"
                  name={partner ? partner.name : "Choose Teammate"}
                  avatarUrl={partner?.avatar}
                  onClick={() => setActiveTarget("partner")}
                />
              )}
            </div>

            {/* VS Badge */}
            <div
              className={`hidden md:flex absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-foreground text-background font-black text-xs items-center justify-center z-20 shadow-md transition-all duration-300 ${
                matchMode === MatchMode.SINGLES ? "top-17" : "top-[59%]"
              }`}
            >
              VS
            </div>

            {/* Team 2 • Opponents */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-muted-foreground italic">
                Team 2 • Opponents
              </span>

              <MatchPlayerCard
                type="empty"
                name={opponents[0] ? opponents[0].name : "Choose Opponent"}
                avatarUrl={opponents[0]?.avatar}
                onClick={() => setActiveTarget("opponent_1")}
              />

              {matchMode === MatchMode.DOUBLES && (
                <MatchPlayerCard
                  type="empty"
                  name={opponents[1] ? opponents[1].name : "Choose Opponent 2"}
                  avatarUrl={opponents[1]?.avatar}
                  onClick={() => setActiveTarget("opponent_2")}
                />
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Select Date & Time */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-bold flex items-center justify-center text-sm">
              3
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">Select Date & Time</h2>
            </div>
          </div>

          <MatchDateTimeSection
            matchDate={matchDate}
            setMatchDate={setMatchDate}
            startTime={startTime}
            setStartTime={setStartTime}
            location={location}
            setLocation={setLocation}
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-border/40 flex flex-col items-end justify-between gap-4">
          <Button
            type="submit"
            disabled={request.isPending}
            className="w-full sm:w-auto h-12 px-8 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold italic tracking-wide shadow-md"
          >
            {request.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending Request...
              </>
            ) : (
              <>
                Send Request <ArrowUpRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </form>

      <MemberSearchModal
        clubSlug={clubSlug}
        isOpen={activeTarget !== null}
        onClose={() => setActiveTarget(null)}
        onSelectMember={handleSelectMember}
        excludeMemberIds={excludedIds}
        title={activeTarget === "partner" ? "Select Your Teammate" : "Select Opponent"}
      />
    </div>
  );
}
