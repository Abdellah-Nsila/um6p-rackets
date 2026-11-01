"use client";

// -> src/components/match/member-search-modal.tsx
import { useState } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useClubMembers } from "@/hooks/use-club-members";

export default function MemberSearchModal({
  clubSlug,
  isOpen,
  onClose,
  onSelectMember,
  excludeMemberIds = [],
  title = "Select Member",
}: {
  clubSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectMember: (
    memberId: number,
    memberName: string,
    department: string,
    avatarUrl: string | null,
  ) => void;
  excludeMemberIds?: number[];
  title?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // role undefined = all members
  const { data, isLoading } = useClubMembers(clubSlug, undefined, isOpen);
  const members = data?.data ?? [];

  const query = searchQuery.toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (excludeMemberIds.includes(m.id)) return false;
    const text = `${m.user.first_name} ${m.user.last_name} ${m.user.login}`.toLowerCase();
    return text.includes(query);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or login..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No members found.</p>
            ) : (
              filteredMembers.map((m) => {
                const name =
                  [m.user.first_name, m.user.last_name].filter(Boolean).join(" ") || m.user.login;
                const dept = m.user.department || "Sport Department";
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMember(m.id, name, dept, m.user.avatar || null);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-brand-orange bg-card hover:bg-accent/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {m.user.avatar ? (
                        <div className="w-9 h-9 rounded-full relative overflow-hidden shrink-0">
                          <Image src={m.user.avatar} alt={name} sizes="40px" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent text-sm shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-foreground">{name}</div>
                        <div className="text-xs text-muted-foreground">
                          {dept} • @{m.user.login}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-brand-orange">Select</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
