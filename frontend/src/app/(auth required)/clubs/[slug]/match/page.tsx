"use client";

import { useParams } from "next/navigation";
import { MemberGate } from "@/components/club/member-gate";
import MatchRequestForm from "@/components/match/match-request-form";
import { useMe } from "@/hooks/use-me";

export default function MatchPage() {
  const { slug: clubSlug } = useParams<{ slug: string }>();

  const { data: user } = useMe();
  const fullName = `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim();

  return (
    <MemberGate slug={clubSlug}>
      {(memberId) => (
        <div className="space-y-12 pb-16">
          {/* Form to create/request a new match */}
          <MatchRequestForm
            clubSlug={clubSlug}
            currentMemberId={memberId}
            currentUserName={fullName || user?.login || "Campus Athlete"}
            currentUserDepartment={user?.department?.trim() || "Sport Department"}
            currentUserAvatar={user?.avatar || null}
          />
        </div>
      )}
    </MemberGate>
  );
}