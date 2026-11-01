'use client';

import { Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Achievement } from '@/types/contracts/club';
import {
  CATEGORY_STYLES,
  getAchievementMeta
} from '@/components/achievement/achievement-meta';

export function AchievementChip({
  code,
  className
}: {
  code: string;
  className?: string;
}) {
  const { Icon, category } = getAchievementMeta(code);
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-xl border flex items-center justify-center shrink-0',
        CATEGORY_STYLES[category],
        className
      )}
    >
      <Icon className="w-5 h-5" />
    </div>
  );
}

// Takes plain data, so it works with the profile response (profile.achievements)
// and with useUserAchievements() alike.
export default function AchievementList({
  achievements
}: {
  achievements: Achievement[];
}) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center gap-2">
        <Trophy className="w-8 h-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground font-medium">
          No achievements yet.
        </p>
      </div>
    );
  }

  const sorted = [...achievements].sort(
    (a, b) => Date.parse(b.taken_at) - Date.parse(a.taken_at)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sorted.map((a) => {
        const { title, description } = getAchievementMeta(a.code);
        return (
          <div
            key={a.id}
            className="p-4 rounded-2xl border border-border/70 bg-card flex items-center gap-3 shadow-2xs"
          >
            <AchievementChip code={a.code} />
            <div className="min-w-0">
              <div className="font-bold text-sm text-foreground truncate">
                {title}
              </div>
              {description && (
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {description}
                </div>
              )}
              <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                {new Date(a.taken_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}