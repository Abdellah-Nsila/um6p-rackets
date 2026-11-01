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
import { useDeleteAdminUser } from "@/hooks/use-admin";
import type { AdminUser } from "@/types/contracts/admin";

export function DeleteUserDialog({
  user,
  onClose,
  onDeleted,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const del = useDeleteAdminUser();

  const confirm = () => {
    if (!user) return;
    del.mutate(user.id, {
      onSuccess: () => {
        onDeleted?.();
        onClose();
      },
    });
  };

  return (
    <AlertDialog open={!!user} onOpenChange={(open) => !open && !del.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this user?</AlertDialogTitle>
          <AlertDialogDescription>
            {user?.first_name} {user?.last_name} (@{user?.login}) will lose access to the platform.
            This can&apos;t be undone from the interface.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          {/* plain Button, so the dialog stays open until the request finishes */}
          <Button variant="destructive" onClick={confirm} disabled={del.isPending}>
            {del.isPending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}