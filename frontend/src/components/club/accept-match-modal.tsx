"use client";

import { Loader2, Inbox, Calendar, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAcceptMatch, usePendingMatches } from "@/hooks/use-matches";
import { formatMatchDate, formatMatchTime, getMySide, teamNames } from "@/lib/match-utils";

interface AcceptMatchModalProps {
  clubSlug: string;
  currentMemberId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function AcceptMatchModal({
  clubSlug,
  currentMemberId,
  isOpen,
  onClose,
}: AcceptMatchModalProps) {
  // Only ask the backend while the sheet is open
  const { data, isLoading, error } = usePendingMatches(clubSlug, isOpen);
  const acceptMatch = useAcceptMatch(clubSlug);

  // A player cannot accept his own request
  const requests = (data?.data ?? []).filter((match) => getMySide(match, currentMemberId) === null);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col px-4 sm:px-6">
        <SheetHeader className="pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-brand-orange" />
            <SheetTitle>Pending Match Requests</SheetTitle>
          </div>
          <SheetDescription>
            Review and accept pending match requests for your club.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-3 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
            </div>
          ) : error ? (
            <p className="text-center py-16 text-sm text-red-500">{error.message}</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm font-medium">
              No pending match requests found.
            </div>
          ) : (
            requests.map((match) => {
              // `variables` is the match id being accepted: only that row shows the spinner
              const isAccepting = acceptMatch.isPending && acceptMatch.variables === match.id;

              return (
                <div
                  key={match.id}
                  className="p-4 rounded-2xl border border-border/70 bg-background flex items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-brand-orange">
                      {match.mode === 2 ? "Doubles Request" : "Singles Request"}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {teamNames(match.team1)} vs {teamNames(match.team2)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatMatchDate(match.scheduled_at)},{" "}
                      {formatMatchTime(match.scheduled_at)}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={acceptMatch.isPending}
                    onClick={() => acceptMatch.mutate(match.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Accept
                  </button>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
