"use client";

import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCancelJoinClub, useJoinClub } from "@/hooks/use-clubs";

// Shown to people who are not members yet: join, or cancel a pending request
export default function MembersOnlyPanel({
  clubSlug,
  clubName,
  hasPendingRequest,
}: {
  clubSlug: string;
  clubName: string;
  hasPendingRequest: boolean;
}) {
  const join = useJoinClub(clubSlug);
  const cancelJoin = useCancelJoinClub(clubSlug);

  return (
    <div className="mt-10 sm:mt-12 flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border/60 rounded-3xl bg-muted/10 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/40 text-brand-orange rounded-full flex items-center justify-center mb-6 shadow-sm border border-orange-200/60 dark:border-orange-900/40">
        <Lock className="w-10 h-10" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-black italic text-brand-ink dark:text-white mb-3">
        Members Only
      </h2>
      <p className="text-muted-foreground font-medium max-w-md mb-8 text-sm sm:text-base">
        You must be an active member to view sessions, leaderboards, and book matches for{" "}
        {clubName}.
      </p>

      {join.isPending || cancelJoin.isPending ? (
        <div className="inline-flex items-center gap-2 px-6 py-4 bg-orange-50 text-brand-orange border border-orange-200 rounded-xl font-bold text-base shadow-sm">
          <Loader2 className="size-5 animate-spin" /> Processing...
        </div>
      ) : hasPendingRequest ? (
        <Button
          onClick={() => cancelJoin.mutate()}
          className="h-12 px-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 font-bold text-base transition-all shadow-sm cursor-pointer"
        >
          Cancel Request
        </Button>
      ) : (
        <Button
          onClick={() => join.mutate()}
          className="h-12 px-10 rounded-xl bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-base tracking-wide shadow-md shadow-brand-orange/20 cursor-pointer"
        >
          Join Club Now
        </Button>
      )}
    </div>
  );
}