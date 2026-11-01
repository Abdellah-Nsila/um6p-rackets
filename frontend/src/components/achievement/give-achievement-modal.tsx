"use client";

// -> src/components/club/give-achievement-modal.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ACHIEVEMENT_GROUPS,
  getAchievementMeta,
} from "@/components/achievement/achievement-meta";
import { useAwardAchievement } from "@/hooks/use-achievements";
import { useClubMembers } from "@/hooks/use-club-members";
import { cn } from "@/lib/utils";
import type { AchievementCode } from "@/types/contracts/achievement-code";
import type { MemberWithUser } from "@/types/contracts/club";

interface GiveAchievementModalProps {
  clubSlug: string;
  currentMemberId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function GiveAchievementModal({
  clubSlug,
  currentMemberId,
  isOpen,
  onClose,
}: GiveAchievementModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<MemberWithUser | null>(null);
  const [code, setCode] = useState<AchievementCode | null>(null);

  // role undefined = every active member
  const { data, isLoading } = useClubMembers(clubSlug, undefined, isOpen);
  const award = useAwardAchievement(clubSlug);

  const query = search.toLowerCase();
  const members = (data?.data ?? []).filter((m) =>
    `${m.user?.first_name ?? ""} ${m.user?.last_name ?? ""} ${m.user?.login ?? ""}`
      .toLowerCase()
      .includes(query),
  );

  const closePicker = () => {
    setTarget(null);
    setCode(null);
  };

  const handleGive = () => {
    if (!target || !code) return;
    // user_id is the auth-service id (member.user_id), not the member id
    award.mutate({ user_id: target.user_id, code }, { onSuccess: closePicker });
  };

  const targetName = target
    ? [target.user?.first_name, target.user?.last_name].filter(Boolean).join(" ") ||
      target.user?.login ||
      "this member"
    : "";

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col px-4 sm:px-6">
          <SheetHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <SheetTitle>Give Achievement</SheetTitle>
            </div>
            <SheetDescription>
              Pick a member, then choose the achievement to give.
            </SheetDescription>
          </SheetHeader>

          <div className="pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-background text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              />
            </div>
          </div>

          <div className="py-4 space-y-3 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm font-medium">
                No members found.
              </div>
            ) : (
              members.map((member) => {
                const name =
                  [member.user?.first_name, member.user?.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  member.user?.login ||
                  "User";
                const dept = member.user?.department || "Sport Department";

                return (
                  <div
                    key={member.id}
                    className="p-4 rounded-2xl border border-border/70 bg-background flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div
                      onClick={() =>
                        router.push(`/profile/${member.user_id}`)
                      }
                      className="space-y-1 cursor-pointer group flex-1"
                    >
                      <div className="text-xs font-bold text-brand-orange">{dept}</div>
                      <div className="text-sm font-bold text-foreground group-hover:text-brand-orange transition-colors">
                        {name}
                      </div>
                    </div>

                    {member.id !== currentMemberId && (
                      <button
                        type="button"
                        onClick={() => setTarget(member)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-200"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Give
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Achievement picker */}
      <Dialog open={target !== null} onOpenChange={(open) => !open && closePicker()}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold">
              Give an achievement to {targetName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              A member can receive each achievement only once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {ACHIEVEMENT_GROUPS.map((group) => (
              <div key={group.category} className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {group.codes.map((c) => {
                    const { title, Icon } = getAchievementMeta(c);
                    const selected = code === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCode(c)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer",
                          selected
                            ? "border-brand-orange bg-orange-50 dark:bg-orange-950/30 text-brand-orange"
                            : "border-border/60 bg-card text-foreground hover:border-brand-orange/50",
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2 sm:space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={closePicker}
              disabled={award.isPending}
              className="rounded-xl h-10 font-bold text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!code || award.isPending}
              onClick={handleGive}
              className="rounded-xl h-10 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              {award.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Giving...
                </>
              ) : (
                "Give Achievement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}