"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, History } from "lucide-react";

import ClubTitle from "@/components/club/club-title";
import OverviewCard from "@/components/club/overview-card";
import ClubTaps from "@/components/club/taps";
import Leaderboard from "@/components/club/leaderboard";
import AcceptMatchModal from "@/components/club/accept-match-modal";
import AcceptJoinModal from "@/components/club/accept-join-modal";
import ManageLeadersModal from "@/components/club/manage-leaders-modal";
import EditClubModal from "@/components/club/edit-club-modal";
import ClubDropdownMenu from "@/components/club/club-dropdown-menu";
import MembersOnlyPanel from "@/components/club/members-only-panel";

import { Button } from "@/components/ui/button";
import { useClub, useClubStatus, useLeaveClub } from "@/hooks/use-clubs";
import { ApiError } from "@/lib/api-error";
import { useClubLeaderboard } from "@/hooks/use-leaderboard";
import { MemberRole } from "@/types/contracts/club";
import { Leaderboard as LeaderboardType } from "@/types";
import ClubAchievements from "@/components/achievement/club-achievement";
import { notFound } from "next/navigation";

// Only one modal is open at a time
type ClubModal = "accept-match" | "accept-join" | "set-leader" | "remove-leader" | "remove-member";

export default function ClubPage() {
  const { slug: clubSlug } = useParams<{ slug: string }>();
  const [openModal, setOpenModal] = useState<ClubModal | null>(null);
  const closeModal = () => setOpenModal(null);

  const { data: club, isLoading: isClubLoading, isError, error } = useClub(clubSlug);
  const {
    data: status,
    isLoading: isChecking,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useClubStatus(clubSlug);
  const leave = useLeaveClub(clubSlug);

  const { data: leaderboardResponse } = useClubLeaderboard(
    clubSlug,
    1,
    5 
  );

  // Safely extract the data array from the ClubLeaderboard paginated response structure
  const LeaderboardData: LeaderboardType[] = leaderboardResponse?.leaderboard?.data ?? [];

  if (isError) {
    const notFoundError = error instanceof ApiError && error.status === 404;
    if (notFoundError) { return notFound(); }
    return notFound();
  }

  const clubName = club?.name ?? clubSlug;
  const description = club?.description ?? `Welcome to ${clubName} campus club.`;

  const isMember = !!status?.is_member;
  const memberId = status?.member_id ?? null;
  const isStaffOnly = isMember && (status?.role ?? MemberRole.MEMBER) >= MemberRole.LEADER;
  const isCoachOnly = isMember && status?.role === MemberRole.COACH;

  // Bottom action buttons (Request Match, Match History, Dropdown)
  const actionButtons = isMember ? (
    <>
      <Link
        href={`/clubs/${clubSlug}/match`}
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs tracking-wide shadow-xs transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Request Match
      </Link>

      <Link
        href={`/clubs/${clubSlug}/match/history`}
        className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border/70 hover:border-brand-orange bg-card text-foreground font-semibold text-xs transition-colors shadow-xs"
      >
        <History className="w-3.5 h-3.5 text-muted-foreground" /> Match History
      </Link>

      <ClubDropdownMenu
        isStaffOnly={isStaffOnly}
        isCoachOnly={isCoachOnly}
        isLeavePending={leave.isPending}
        onOpenAcceptModal={() => setOpenModal("accept-match")}
        onOpenAcceptJoinModal={() => setOpenModal("accept-join")}
        onOpenRemoveMemberModal={() => setOpenModal("remove-member")}
        onOpenSetLeaderModal={() => setOpenModal("set-leader")}
        onOpenRemoveLeaderModal={() => setOpenModal("remove-leader")}
        onLeaveClub={() => leave.mutate()}
      />
    </>
  ) : null;

  // The edit form must start from the real description, not from the "Welcome to..." placeholder
  const topActionSlot = isCoachOnly ? (
    <EditClubModal
      clubSlug={clubSlug}
      currentName={clubName}
      currentDescription={club?.description ?? ""}
    />
  ) : null;

  return (
    <div className="w-[92%] xl:w-[80%] mx-auto pb-20">
      {isClubLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="size-10 animate-spin text-brand-orange" />
        </div>
      ) : (
        <>
          <ClubTitle name={clubName} slug={clubSlug} />

          <section className="relative mt-4">
            <OverviewCard
              desc={description}
              coach={club?.coach_full_name ?? "N/A"}
              members={club?.members_count ?? 0}
              actions={actionButtons}
              topAction={topActionSlot}
            />
          </section>

          {isChecking ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="size-10 animate-spin text-brand-orange" />
            </div>
          ) : isStatusError ? (
            <div className="mt-10 text-center">
              <p className="text-muted-foreground mb-4">Could not check your membership.</p>
              <Button variant="outline" onClick={() => refetchStatus()}>
                Retry
              </Button>
            </div>
          ) : status?.is_member ? (
            <div className="w-full flex flex-col items-center justify-center mt-10 sm:mt-12">
              <div className="grid grid-cols-1 min-[1500px]:grid-cols-2 gap-8 w-full animate-in fade-in duration-500 items-stretch">
                
                {/* Row 1, Col 1: Sessions (Taps) */}
                <section className="flex flex-col min-w-0">
                  <ClubTaps clubSlug={clubSlug} userRole={status.role} />
                </section>
                
                {/* Row 1, Col 2: Leaderboard */}
                <section className="flex flex-col min-w-0">
                  <Leaderboard 
                    leaderboardData={LeaderboardData} 
                    clubSlug={clubSlug} 
                  />
                </section>

                {/* Row 2, Col 1: Achievements (Centered on small screens, left-aligned on 1500px+) */}
                <section className="flex flex-col min-w-0 w-full max-w-2xl mx-auto min-[1500px]:max-w-none min-[1500px]:mx-0">
                  {memberId !== null && (
                    <ClubAchievements
                      clubSlug={clubSlug}
                      currentMemberId={memberId}
                      canManage={isStaffOnly}
                    />
                  )}
                </section>

                {/* Row 2, Col 2: Invisible Spacer (Now on the RIGHT) */}
                <div className="hidden min-[1500px]:block" />
              </div>
            </div>
          ) : (
            <MembersOnlyPanel
              clubSlug={clubSlug}
              clubName={clubName}
              hasPendingRequest={!!status?.has_pending_request}
            />
          )}
        </>
      )}

      {/* Modals: only for members, who always have a member id */}
      {memberId !== null && (
        <>
          <AcceptMatchModal
            clubSlug={clubSlug}
            currentMemberId={memberId}
            isOpen={openModal === "accept-match"}
            onClose={closeModal}
          />
          <AcceptJoinModal
            clubSlug={clubSlug}
            isOpen={openModal === "accept-join"}
            onClose={closeModal}
          />
          <ManageLeadersModal
            clubSlug={clubSlug}
            currentMemberId={memberId}
            isOpen={openModal === "set-leader"}
            onClose={closeModal}
            mode="set"
          />
          <ManageLeadersModal
            clubSlug={clubSlug}
            currentMemberId={memberId}
            isOpen={openModal === "remove-leader"}
            onClose={closeModal}
            mode="remove"
          />
          <ManageLeadersModal
            clubSlug={clubSlug}
            currentMemberId={memberId}
            isOpen={openModal === "remove-member"}
            onClose={closeModal}
            mode="remove-member"
          />
        </>
      )}
    </div>
  );
}
