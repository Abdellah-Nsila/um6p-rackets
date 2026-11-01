"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/auth/form-parts";
import { useUpdateClub } from "@/hooks/use-clubs";
import { updateClubSchema, type UpdateClubValues } from "@/lib/schemas/club";

const NAME_MAX_LENGTH = 12;

interface EditClubModalProps {
  clubSlug: string;
  currentName: string;
  currentDescription: string;
}

export default function EditClubModal({
  clubSlug,
  currentName,
  currentDescription,
}: EditClubModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateClub = useUpdateClub(clubSlug);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateClubValues>({
    resolver: zodResolver(updateClubSchema),
    defaultValues: { name: currentName, description: currentDescription },
  });

  const nameLength = (useWatch({ control, name: "name" }) ?? "").length;

  // Start from the club's current values every time the dialog opens,
  // so a second edit never shows the values from before the first one
  const handleOpenChange = (open: boolean) => {
    if (open) reset({ name: currentName, description: currentDescription });
    setIsOpen(open);
  };

  const onSubmit = (values: UpdateClubValues) => {
    updateClub.mutate(values, { onSuccess: () => setIsOpen(false) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-border/70 hover:border-brand-orange bg-card text-foreground transition-colors shadow-xs cursor-pointer focus-visible:outline-none group"
            title="Edit Club Info"
            aria-label="Edit Club Info"
          >
            <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-brand-orange transition-colors" />
          </button>
        }
      />

      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic">Edit Club Info</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2" noValidate>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">
                Club Name *
              </Label>
              <span
                className={`text-[11px] font-bold ${
                  nameLength > NAME_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {nameLength}/{NAME_MAX_LENGTH}
              </span>
            </div>
            <Input
              id="name"
              placeholder="e.g. Badminton"
              className="h-10.5 rounded-xl bg-background/60"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider">
              Description *
            </Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Club description..."
              className="rounded-xl bg-background/60"
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="rounded-xl h-10 font-bold text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateClub.isPending}
              className="rounded-xl h-10 bg-brand-orange hover:bg-brand-orange/90 text-white font-black italic text-xs tracking-wide shadow-md shadow-brand-orange/20 cursor-pointer"
            >
              {updateClub.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Saving...
                </>
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
