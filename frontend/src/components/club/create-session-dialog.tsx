"use client";

import { useState } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { FieldError } from "@/components/auth/form-parts";
import { useCreateSession } from "@/hooks/use-sessions";
import { cn } from "@/lib/utils";
import { createSessionSchema, type CreateSessionValues } from "@/lib/schemas/session";

const DEFAULT_VALUES: Partial<CreateSessionValues> = {
  title: "",
  location: "",
  capacity: 20,
  date: undefined,
  startTime: "",
  endTime: "",
  repeatWeekly: true,
};

// The backend counts weekdays from Monday (0) to Sunday (6), and wants the Monday of the week
function toBackendDay(date: Date) {
  const weekday = (date.getDay() + 6) % 7;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - weekday);
  return { weekday, weekStart: format(monday, "yyyy-MM-dd") };
}

export default function CreateSessionDialog({ clubSlug }: { clubSlug: string }) {
  const [open, setOpen] = useState(false);
  const createSession = useCreateSession(clubSlug);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSessionValues>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = (values: CreateSessionValues) => {
    const { weekday, weekStart } = toBackendDay(values.date);

    createSession.mutate(
      {
        title: values.title,
        location: values.location,
        capacity: values.capacity,
        weekday,
        start_time: values.startTime,
        end_time: values.endTime,
        week_start: weekStart,
        repeat_weekly: values.repeatWeekly,
      },
      {
        onSuccess: () => {
          setOpen(false);
          reset(DEFAULT_VALUES);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs sm:text-sm font-semibold transition-colors bg-brand-orange hover:bg-brand-orange/90 text-white shadow-xs h-9 sm:h-10 px-3 sm:px-4 gap-1.5 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer not-italic">
        <Plus className="w-4 h-4 stroke-[2.5]" /> New Session
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="session-title">Title</Label>
            <Input
              id="session-title"
              placeholder="e.g., Beginners Training"
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="space-y-2 flex flex-col">
            <Label>Date</Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "inline-flex items-center justify-between whitespace-nowrap rounded-md text-sm font-normal border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="w-4 h-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
              )}
            />
            <FieldError message={errors.date?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-start">Start Time</Label>
              <Input id="session-start" type="time" {...register("startTime")} />
              <FieldError message={errors.startTime?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-end">End Time</Label>
              <Input id="session-end" type="time" {...register("endTime")} />
              <FieldError message={errors.endTime?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-location">Location</Label>
              <Input id="session-location" placeholder="Court 1" {...register("location")} />
              <FieldError message={errors.location?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-capacity">Capacity</Label>
              <Input
                id="session-capacity"
                type="number"
                min="1"
                {...register("capacity", { valueAsNumber: true })}
              />
              <FieldError message={errors.capacity?.message} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="repeatWeekly"
              className="w-4 h-4 rounded cursor-pointer accent-brand-orange"
              {...register("repeatWeekly")}
            />
            <Label htmlFor="repeatWeekly" className="font-normal text-sm cursor-pointer">
              Schedule as a recurring weekly session
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSession.isPending}
              className="bg-brand-orange text-white"
            >
              {createSession.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
