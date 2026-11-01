import { Users, Whistle } from 'lucide-react';
import { Card } from '../ui/card';
import { ReactNode } from 'react';

export default function OverviewCard({
  desc,
  members,
  coach,
  actions,
  topAction,
}: {
  desc: string;
  members: number;
  coach?: string | null;
  actions?: ReactNode;
  topAction?: ReactNode;
}) {
  const coachDisplay = coach && coach.trim() !== '' ? coach : 'Pending';

  return (
    <Card className="p-4 sm:p-7 rounded-xl sm:rounded-2xl border border-border/70 shadow-2xs bg-card sm:bg-gray-50 dark:bg-gray-800/80 w-full">
      {/* Top Header Row: Title on left with right padding, Edit Pencil fixed on top right */}
      <div className="relative flex items-start justify-between gap-4 mb-2 pr-14">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground wrap-break-word">
          Club Overview
        </h2>

        {topAction && (
          <div className="absolute top-0 right-0">
            {topAction}
          </div>
        )}
      </div>

      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed w-full mb-5 sm:mb-6 wrap-break-word">
        {desc}
      </p>

      {/* Bottom Footer Row: Stats & Bottom Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-border/50">
        <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base text-foreground leading-tight">
                {members}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Active Members</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0 shadow-2xs">
              <Whistle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base text-foreground leading-tight whitespace-nowrap">
                {coachDisplay}
              </div>
              <div className="text-xs text-muted-foreground font-medium">Head Coach</div>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons Slot (Request Match, History, Dropdown) */}
        {actions && (
          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </Card>
  );
}
