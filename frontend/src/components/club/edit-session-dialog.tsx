"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { FieldError } from "@/components/auth/form-parts";
import { useUpdateSession } from "@/hooks/use-sessions";
import { formatTime } from "@/lib/date-utils";
import { sessionFormSchema, type SessionFormValues } from "@/lib/schemas/session";
import type { SessionView } from "@/types/contracts/club";

const toFormValues = (session: SessionView): SessionFormValues => ({
  title: session.title ?? "",
  location: session.location ?? "",
  capacity: session.capacity,
  startTime: formatTime(session.start_at),
  endTime: formatTime(session.end_at),
});

export default function EditSessionDialog({
  session,
  clubSlug,
}: {
  session: SessionView;
  clubSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [applyToFuture, setApplyToFuture] = useState(false);
  const updateSession = useUpdateSession(clubSlug);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: toFormValues(session),
  });

  // Start from the current values every time the dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) {
      reset(toFormValues(session));
      setApplyToFuture(false);
    }
    setOpen(next);
  };

  const onSubmit = (values: SessionFormValues) => {
    updateSession.mutate(
      {
        sessionId: session.id,
        body: {
          title: values.title,
          location: values.location,
          capacity: values.capacity,
          start_time: values.startTime,
          end_time: values.endTime,
          apply_to_future: applyToFuture,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        aria-label="Edit session"
        className="inline-flex items-center justify-center rounded-md transition-colors hover:bg-muted text-foreground/70 h-8 w-8 shrink-0 cursor-pointer focus-visible:outline-none"
      >
        <Pencil className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>Update the details for this session slot.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`title-${session.id}`}>Title</Label>
            <Input id={`title-${session.id}`} {...register("title")} />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`start-${session.id}`}>Start Time</Label>
              <Input id={`start-${session.id}`} type="time" {...register("startTime")} />
              <FieldError message={errors.startTime?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`end-${session.id}`}>End Time</Label>
              <Input id={`end-${session.id}`} type="time" {...register("endTime")} />
              <FieldError message={errors.endTime?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`location-${session.id}`}>Location</Label>
              <Input id={`location-${session.id}`} {...register("location")} />
              <FieldError message={errors.location?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`capacity-${session.id}`}>Capacity</Label>
              <Input
                id={`capacity-${session.id}`}
                type="number"
                min="1"
                {...register("capacity", { valueAsNumber: true })}
              />
              <FieldError message={errors.capacity?.message} />
            </div>
          </div>

          {session.template_id !== null && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id={`applyFuture-${session.id}`}
                checked={applyToFuture}
                onChange={(e) => setApplyToFuture(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-brand-orange"
              />
              <Label
                htmlFor={`applyFuture-${session.id}`}
                className="font-normal text-sm cursor-pointer"
              >
                Apply changes to all future recurring sessions
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateSession.isPending}
              className="bg-brand-orange text-white"
            >
              {updateSession.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
