"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Label } from "../ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useDeleteSession } from "@/hooks/use-sessions";
import type { SessionView } from "@/types/contracts/club";

export default function DeleteSessionDialog({
  session,
  clubSlug,
}: {
  session: SessionView;
  clubSlug: string;
}) {
  const [applyToFuture, setApplyToFuture] = useState(false);
  const deleteSession = useDeleteSession(clubSlug);

  const handleDelete = () => {
    deleteSession.mutate({ sessionId: session.id, applyToFuture });
  };

  return (
    <AlertDialog onOpenChange={(open) => open && setApplyToFuture(false)}>
      <AlertDialogTrigger
        aria-label="Cancel session"
        className="inline-flex items-center justify-center rounded-md transition-colors hover:bg-destructive/10 text-destructive h-8 w-8 shrink-0 cursor-pointer focus-visible:outline-none"
      >
        <Trash2 className="w-4 h-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>

        {session.template_id !== null && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`deleteFuture-${session.id}`}
              checked={applyToFuture}
              onChange={(e) => setApplyToFuture(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-brand-orange"
            />
            <Label
              htmlFor={`deleteFuture-${session.id}`}
              className="font-normal text-sm cursor-pointer"
            >
              Also cancel all future sessions of this series
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSession.isPending}
            className="bg-destructive text-white hover:bg-white hover:border-destructive hover:text-destructive"
          >
            Cancel session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
