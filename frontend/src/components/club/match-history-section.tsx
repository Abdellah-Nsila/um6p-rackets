"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar, Clock, MapPin, XCircle, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import Pagination from "@/components/leaderboard/pagination";
import { useClubStatus } from "@/hooks/use-clubs";
import { useClubMatches, useCancelMatch, useSubmitMatchResult } from "@/hooks/use-matches";
import {
  formatMatchDate,
  formatMatchTime,
  getMySide,
  playerName,
  teamNames,
} from "@/lib/match-utils";
import { MatchMineFilter, MatchStatus, MemberRole, type MatchDetail } from "@/types/contracts/club";
import { matchResultSchema, type MatchResultValues } from "@/lib/schemas/match-Result";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Tab = "mine" | "referee" | "club";

const PAGE_SIZE = 10;

const TABS: { value: Tab; label: string }[] = [
  { value: "mine", label: "My Matches" },
  { value: "referee", label: "Referee Matches" },
  { value: "club", label: "Club Matches" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGES = {
  [MatchStatus.PENDING]: {
    label: "PENDING",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  [MatchStatus.CONFIRMED]: {
    label: "UPCOMING",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  [MatchStatus.FINISHED]: {
    label: "FINISHED",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  [MatchStatus.CANCELLED]: {
    label: "CANCELLED",
    className: "bg-muted text-muted-foreground border-border/40",
  },
};

const PILL = "px-3 py-1 rounded-full font-bold text-xs shrink-0 border text-center tracking-wider";

function MatchCard({
  clubSlug,
  match,
  memberId,
  tab,
  isStaff,
  isCancelling,
  cancelDisabled,
  onCancel,
}: {
  clubSlug: string;
  match: MatchDetail;
  memberId: number;
  tab: Tab;
  isStaff: boolean;
  isCancelling: boolean;
  cancelDisabled: boolean;
  onCancel: () => void;
}) {
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const submitResult = useSubmitMatchResult(clubSlug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MatchResultValues>({
    resolver: zodResolver(matchResultSchema),
    defaultValues: { team1_score: 0, team2_score: 0 },
  });

  const onResultSubmit = (values: MatchResultValues) => {
    submitResult.mutate(
      { matchId: match.id, team1_score: values.team1_score, team2_score: values.team2_score },
      {
        onSuccess: () => {
          reset();
          setIsResultOpen(false);
        },
      }
    );
  };

  const mySide = getMySide(match, memberId);
  const isReferee = match.ref_id === memberId;
  const showAsPlayer = mySide !== null && tab !== "referee";

  const isPending = match.status === MatchStatus.PENDING;
  const isConfirmed = match.status === MatchStatus.CONFIRMED;
  const isFinished = match.status === MatchStatus.FINISHED;
  const isCancelled = match.status === MatchStatus.CANCELLED;

  const userWon =
    mySide !== null && match.winner_id === (mySide === "team1" ? match.team1_id : match.team2_id);

  const canCancel =
    (isStaff && !isFinished && !isCancelled) || (isPending && (tab !== "club" || mySide !== null));

  const canSetResult =
    tab === "referee" &&
    isReferee &&
    isConfirmed &&
    new Date(match.scheduled_at).getTime() <= now;

  const statusBadge = STATUS_BADGES[match.status];

  const team1Names = showAsPlayer && mySide === "team1"
    ? ["You", match.team1.player1.member_id === memberId ? playerName(match.team1.player2) : playerName(match.team1.player1)].filter(Boolean)
    : teamNames(match.team1).split(" & ");

  const team2Names = showAsPlayer && mySide === "team2"
    ? ["You", match.team2.player1.member_id === memberId ? playerName(match.team2.player2) : playerName(match.team2.player1)].filter(Boolean)
    : teamNames(match.team2).split(" & ");

  const scoreBoxClass = isFinished && showAsPlayer
    ? userWon
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
      : "bg-red-500/10 border-red-500/30 text-red-700"
    : "bg-muted/40 border-border/70 text-foreground";

  const cardBorderClass = showAsPlayer
    ? "border-2 border-brand-orange shadow-2xs"
    : isReferee
      ? "border-2 border-brand-teal shadow-2xs"
      : "border border-border/70";

  return (
    <div className={cn("p-4 sm:p-5 rounded-2xl bg-card flex flex-col gap-4 transition-colors", cardBorderClass)}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col items-start gap-2 shrink-0 min-w-32">
          <div className={cn(PILL, statusBadge.className)}>{statusBadge.label}</div>
          {match.mode === 2 && (
            <div className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold text-[11px] border border-border/40 uppercase tracking-wider">
              Doubles
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 sm:gap-4 w-full min-w-0">
          
          {/* Team 1 Cards */}
          <div className="flex-1 flex flex-col gap-2 w-full min-w-0 justify-center">
            {team1Names.map((name, index) => (
              <div key={index} className="w-full p-2.5 sm:p-3 rounded-2xl border border-border/70 bg-background/50 flex items-center justify-center text-center overflow-hidden">
                <div className="font-bold text-sm leading-snug text-foreground break-words w-full px-2" title={name}>
                  {name}
                </div>
              </div>
            ))}
          </div>

          {/* Score / VS Box */}
          <div className={cn("px-4 py-2.5 sm:py-3 rounded-2xl border flex flex-col items-center justify-center shrink-0 min-w-24 sm:min-w-28 shadow-2xs self-center", scoreBoxClass)}>
            {isFinished ? (
              <span className="font-black text-base sm:text-lg tracking-widest whitespace-nowrap">
                {match.team1_score} - {match.team2_score}
              </span>
            ) : (
              <span className="font-black italic text-brand-orange text-xs tracking-wider">VS</span>
            )}
          </div>

          {/* Team 2 Cards */}
          <div className="flex-1 flex flex-col gap-2 w-full min-w-0 justify-center">
            {team2Names.map((name, index) => (
              <div key={index} className="w-full p-2.5 sm:p-3 rounded-2xl border border-border/70 bg-background/50 flex items-center justify-center text-center overflow-hidden">
                <div className="font-bold text-sm leading-snug text-foreground break-words w-full px-2" title={name}>
                  {name}
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          {canSetResult && (
            <Dialog open={isResultOpen} onOpenChange={(open) => { setIsResultOpen(open); if (!open) reset(); }}>
              <button
                type="button"
                onClick={() => setIsResultOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-foreground hover:text-brand-orange hover:bg-muted/50 border border-border/70 text-xs font-semibold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5 text-brand-orange shrink-0" /> Set Result
              </button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set Match Result</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onResultSubmit)} className="space-y-4 pt-4">
                  <div className="flex gap-4 items-stretch">
                    <div className="flex-1 space-y-2 flex flex-col justify-between">
                      <Label className="leading-snug">{teamNames(match.team1)} Score</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        {...register("team1_score", { valueAsNumber: true })} 
                      />
                    </div>
                    <div className="flex-1 space-y-2 flex flex-col justify-between">
                      <Label className="leading-snug">{teamNames(match.team2)} Score</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        {...register("team2_score", { valueAsNumber: true })} 
                      />
                    </div>
                  </div>
                  {errors.team2_score?.message?.includes("draw") && (
                    <p className="text-xs text-destructive font-medium">{errors.team2_score.message}</p>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { reset(); setIsResultOpen(false); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitResult.isPending} className="bg-brand-orange hover:bg-brand-orange/90 text-white">
                      {submitResult.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Result"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {canCancel && (
            <button
              type="button"
              disabled={cancelDisabled}
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-red-500 hover:text-white hover:bg-red-500 border border-red-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-border/60 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1 text-foreground font-medium">
          <MapPin className="w-3.5 h-3.5 text-brand-orange" /> {match.location || "Sports Department"}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> {formatMatchDate(match.scheduled_at)}
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {formatMatchTime(match.scheduled_at)}
        </span>
      </div>
    </div>
  );
}

export default function MatchHistorySection({
  clubSlug,
  currentMemberId,
}: {
  clubSlug: string;
  currentMemberId: number;
}) {
  const { data: status } = useClubStatus(clubSlug);
  const isStaff = (status?.role ?? MemberRole.MEMBER) >= MemberRole.LEADER;

  const [tab, setTab] = useState<Tab>("mine");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: refereeData } = useClubMatches(clubSlug, String(MatchMineFilter.REFEREE), "all", 1, 1);
  const hasRefereeMatches = (refereeData?.total ?? 0) > 0;

  const { data, isLoading, error } = useClubMatches(
    clubSlug,
    tab === "mine"
      ? String(MatchMineFilter.PLAYER)
      : tab === "referee"
        ? String(MatchMineFilter.REFEREE)
        : tab === "club"
          ? null
          : String(MatchMineFilter.ANY),
    statusFilter,
    page,
    PAGE_SIZE,
  );
  const cancelMatch = useCancelMatch(clubSlug);

  const matches = [...(data?.data ?? [])].sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
  );
  const totalItems = data?.total ?? 0;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  const changeTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto py-6 px-4">
      <div>
        <h1 className="text-3xl font-black italic tracking-tight text-foreground">
          Match <span className="text-brand-orange">History</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track official match fixtures, review past scores, and manage your active challenges.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex gap-2 bg-muted/40 p-1 rounded-xl flex-wrap">
          {TABS.filter((t) => t.value !== "referee" || hasRefereeMatches).map((t) => (
            <button
              key={t.value}
              onClick={() => changeTab(t.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                tab === t.value
                  ? "bg-brand-orange text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 px-3 rounded-xl border border-border/70 bg-background text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 min-h-75">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
          </div>
        ) : error ? (
          <p className="text-center text-sm text-red-500 py-10">{error.message}</p>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl">
            <p className="text-sm text-muted-foreground font-medium">No matches found.</p>
          </div>
        ) : (
          matches.map((match) => (
            <MatchCard
              key={match.id}
              clubSlug={clubSlug}
              match={match}
              memberId={currentMemberId}
              tab={tab}
              isStaff={isStaff}
              isCancelling={cancelMatch.isPending && cancelMatch.variables === match.id}
              cancelDisabled={cancelMatch.isPending}
              onCancel={() => cancelMatch.mutate(match.id)}
            />
          ))
        )}
      </div>

      {!isLoading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          <span>
            Displaying {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)} of{" "}
            {totalItems} matches
          </span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
