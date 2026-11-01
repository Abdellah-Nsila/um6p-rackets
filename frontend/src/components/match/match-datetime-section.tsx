"use client";

import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const LABEL_CLASS = "flex items-center gap-1.5 text-xs font-semibold text-muted-foreground";
const INPUT_CLASS = "h-11 border-border/70 rounded-xl bg-background";

export default function MatchDateTimeSection({
  matchDate,
  setMatchDate,
  startTime,
  setStartTime,
  location,
  setLocation,
}: {
  matchDate: Date;
  setMatchDate: (date: Date) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  location: string;
  setLocation: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      {/* Date Picker */}
      <div className="space-y-2">
        <Label className={LABEL_CLASS}>
          <CalendarIcon className="w-3.5 h-3.5 text-brand-orange" /> Date
        </Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="w-full justify-between font-normal text-left h-11 border-border/70 rounded-xl bg-background"
              />
            }
          >
            {matchDate ? format(matchDate, "MM / dd / yyyy") : <span>Pick a date</span>}
            <CalendarIcon className="w-4 h-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={matchDate}
              onSelect={(date) => date && setMatchDate(date)}
              // Disable any date before today (ignoring the time portion)
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Start Time */}
      <div className="space-y-2">
        <Label htmlFor="match-start" className={LABEL_CLASS}>
          <Clock className="w-3.5 h-3.5 text-brand-orange" /> Start Time
        </Label>
        <Input
          id="match-start"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className={INPUT_CLASS}
          required
        />
      </div>

      {/* Place / Court */}
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="match-location" className={LABEL_CLASS}>
          <MapPin className="w-3.5 h-3.5 text-brand-orange" /> Place / Court
        </Label>
        <Input
          id="match-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
          placeholder="Enter court or location"
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}