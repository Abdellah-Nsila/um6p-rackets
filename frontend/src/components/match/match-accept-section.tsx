'use client';

// -> src/components/match/match-accept-section.tsx
import { Loader2, Calendar, CheckCircle2, Inbox } from 'lucide-react';

import { useAcceptMatch, usePendingMatches } from '@/hooks/use-matches';
import { MatchMode } from '@/types/contracts/club';
import type { Player } from '@/types/contracts/club';

const fullName = (p: Player) =>
  [p.first_name, p.last_name].filter(Boolean).join(' ') || p.login;

export default function MatchAcceptSection({ clubSlug }: { clubSlug: string }) {
  const { data, isLoading, isError } = usePendingMatches(clubSlug);
  const accept = useAcceptMatch(clubSlug);

  const pendingRequests = data?.data ?? [];

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto py-6 px-4">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black italic tracking-tight text-foreground">
          Match <span className="text-brand-orange">Accept</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review pending challenge requests from other players and accept them to
          confirm your matches.
        </p>
      </div>

      {/* Pending List */}
      <div className="space-y-3 min-h-75">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
          </div>
        ) : isError ? (
          <p className="text-center text-sm text-red-500 py-10">
            Failed to load match requests.
          </p>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center gap-2">
            <Inbox className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground font-medium">
              No pending match requests to accept.
            </p>
          </div>
        ) : (
          pendingRequests.map((match) => {
            const isDoubles = match.mode === MatchMode.DOUBLES;
            const { player1, player2 } = match.team2;
            const opponents =
              isDoubles && player2
                ? `${fullName(player1)} & ${fullName(player2)}`
                : player1
                  ? fullName(player1)
                  : 'Opponent';

            // spinner only on the row being accepted
            const isAccepting = accept.isPending && accept.variables === match.id;

            return (
              <div
                key={match.id}
                className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-brand-orange/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs border border-amber-500/20">
                    {isDoubles ? 'Doubles Request' : 'Singles Request'}
                  </div>
                  <div className="font-bold text-sm text-foreground pt-1">
                    vs {opponents}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />{' '}
                    {match.scheduled_at
                      ? new Date(match.scheduled_at).toLocaleDateString()
                      : '-'}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={accept.isPending}
                  onClick={() => accept.mutate(match.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 self-end sm:self-center"
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
    </div>
  );
}