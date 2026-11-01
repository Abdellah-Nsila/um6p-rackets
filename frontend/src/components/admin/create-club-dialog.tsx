"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminUsers, useCreateAdminClub } from "@/hooks/use-admin";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { createClubSchema, type CreateClubValues } from "@/lib/schemas/admin";
import type { AdminUser, CreateClubBody } from "@/types/contracts/admin";

const toClubBody = (v: CreateClubValues): CreateClubBody => ({
  name: v.name,
  description: v.description || null,
  coach_user_id: Number(v.coach_user_id),
});

export function CreateClubDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {/* mounted only while open, so the form resets every time */}
        {open && <CreateClubForm onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CreateClubForm({ onClose }: { onClose: () => void }) {
  const create = useCreateAdminClub();
  const [coach, setCoach] = useState<AdminUser | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateClubValues>({
    resolver: zodResolver(createClubSchema),
    defaultValues: { name: "", description: "", coach_user_id: "" },
  });

  const pickCoach = (u: AdminUser) => {
    setCoach(u);
    setValue("coach_user_id", String(u.id), { shouldValidate: true });
  };

  const onSubmit = (values: CreateClubValues) =>
    create.mutate(toClubBody(values), { onSuccess: onClose });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create club</DialogTitle>
        <DialogDescription>The slug is generated from the name.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={3} {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Coach</Label>
        <CoachPicker selected={coach} onPick={pickCoach} />
        {errors.coach_user_id && (
          <p className="text-sm text-destructive">
            {coach ? errors.coach_user_id.message : "Pick a coach."}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CoachPicker({
  selected,
  onPick,
}: {
  selected: AdminUser | null;
  onPick: (u: AdminUser) => void;
}) {
  const [q, setQ] = useState("");
  const search = useDebouncedValue(q);
  const { data, isLoading } = useAdminUsers({ search, limit: 5 });

  return (
    <div className="space-y-2">
      {selected && (
        <p className="text-sm">
          Selected: <span className="font-medium">{selected.first_name} {selected.last_name}</span>{" "}
          <span className="text-muted-foreground">@{selected.login}</span>
        </p>
      )}
      <Input
        placeholder="Search a user by name or login..."
        value={q}
        maxLength={100}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="rounded-md border">
        {isLoading && <p className="p-3 text-sm text-muted-foreground">Loading...</p>}
        {data?.data.length === 0 && <p className="p-3 text-sm text-muted-foreground">No users found.</p>}
        {data?.data.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onPick(u)}
            className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted ${
              selected?.id === u.id ? "bg-muted" : ""
            }`}
          >
            <span className="font-medium">{u.first_name} {u.last_name}</span>
            <span className="text-xs text-muted-foreground">@{u.login} · {u.email}</span>
          </button>
        ))}
      </div>
    </div>
  );
}