"use client";

import {
  CheckCircle2,
  UserCheck,
  UserX,
  ShieldCheck,
  UserMinus,
  MoreVertical,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClubDropdownMenuProps {
  isStaffOnly: boolean;
  isCoachOnly: boolean;
  isLeavePending: boolean;
  onOpenAcceptModal: () => void;
  onOpenAcceptJoinModal: () => void;
  onOpenRemoveMemberModal: () => void;
  onOpenSetLeaderModal: () => void;
  onOpenRemoveLeaderModal: () => void;
  onLeaveClub: () => void;
}

export default function ClubDropdownMenu({
  isStaffOnly,
  isCoachOnly,
  isLeavePending,
  onOpenAcceptModal,
  onOpenAcceptJoinModal,
  onOpenRemoveMemberModal,
  onOpenSetLeaderModal,
  onOpenRemoveLeaderModal,
  onLeaveClub,
}: ClubDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 lg:hover:border-brand-orange bg-card text-foreground transition-colors shadow-xs cursor-pointer focus-visible:outline-none"
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent className="w-52" align="end">
        <DropdownMenuGroup>
          {isStaffOnly && (
            <>
              {/* Added focus:bg-transparent focus:text-foreground so it is not highlighted by default */}
              <DropdownMenuItem
                onClick={onOpenAcceptModal}
                className="cursor-pointer font-medium text-xs gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> pending Match Requests
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenAcceptJoinModal}
                className="cursor-pointer font-medium text-xs gap-2"
              >
                <UserCheck className="w-4 h-4 text-brand-orange" /> Pending Join Requests
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenRemoveMemberModal}
                className="cursor-pointer font-medium text-xs gap-2"
              >
                <UserX className="w-4 h-4 text-red-500" /> Remove Member
              </DropdownMenuItem>
            </>
          )}

          {isCoachOnly && (
            <>
              <DropdownMenuItem
                onClick={onOpenSetLeaderModal}
                className="cursor-pointer font-medium text-xs gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-blue-500" /> upgrade to Leader
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onOpenRemoveLeaderModal}
                className="cursor-pointer font-medium text-xs gap-2"
              >
                <UserMinus className="w-4 h-4 text-amber-500" /> downgrade to Member
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={onLeaveClub}
            disabled={isLeavePending}
            className="cursor-pointer font-semibold text-xs text-destructive hover:text-white hover:bg-destructive focus:text-white focus:bg-destructive gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Leave Club
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
