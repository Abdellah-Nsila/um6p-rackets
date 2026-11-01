"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteAdminClub } from "@/hooks/use-admin";

export type ClubRow = { club_id: number; name: string; slug: string; members_count: number };

export function DeleteClubDialog({ club, onClose }: { club: ClubRow | null; onClose: () => void }) {
  const del = useDeleteAdminClub();

  const confirm = () => {
    if (!club) return;
    del.mutate(club.slug, { onSuccess: onClose });
  };

  return (
    <AlertDialog open={!!club} onOpenChange={(open) => !open && !del.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {club?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            The club and its {club?.members_count} active members lose access to it. This can&apos;t be
            undone from the interface.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={del.isPending}>
            {del.isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}