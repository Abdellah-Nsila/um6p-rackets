// The backend only stores the code. Title, description, icon and color live here.
// Record<AchievementCode, ...> makes TypeScript fail when a new code is added
// to the enum and not added here.
import {
  Award,
  CalendarCheck,
  CalendarDays,
  Crown,
  Flag,
  Flame,
  HeartHandshake,
  Medal,
  Star,
  Target,
  TrendingUp,
  Trophy,
  type LucideIcon
} from 'lucide-react';

import { AchievementCode } from '@/types/contracts/achievement-code';

export type AchievementCategory = 'competition' | 'attendance' | 'club';

export type AchievementMeta = {
  title: string;
  description: string;
  category: AchievementCategory;
  Icon: LucideIcon;
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  competition: 'Competition',
  attendance: 'Attendance',
  club: 'Club life'
};

// Tailwind classes for the icon chip of each category
export const CATEGORY_STYLES: Record<AchievementCategory, string> = {
  competition:
    'bg-amber-50 text-amber-600 border-amber-200/70 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40',
  attendance:
    'bg-emerald-50 text-emerald-600 border-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40',
  club: 'bg-purple-50 text-purple-600 border-purple-200/70 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/40'
};

export const ACHIEVEMENTS: Record<AchievementCode, AchievementMeta> = {
  // competition
  [AchievementCode.FIRST_WIN]: {
    title: 'First Win',
    description: 'Won a first official match.',
    category: 'competition',
    Icon: Trophy
  },
  [AchievementCode.TEN_WINS]: {
    title: '10 Wins',
    description: 'Won 10 official matches.',
    category: 'competition',
    Icon: Medal
  },
  [AchievementCode.FIFTY_WINS]: {
    title: '50 Wins',
    description: 'Won 50 official matches.',
    category: 'competition',
    Icon: Crown
  },
  [AchievementCode.WIN_STREAK_5]: {
    title: 'Hot Streak',
    description: 'Won 5 matches in a row.',
    category: 'competition',
    Icon: Flame
  },
  [AchievementCode.SEASON_CHAMPION]: {
    title: 'Season Champion',
    description: 'Finished the season in first place.',
    category: 'competition',
    Icon: Award
  },
  [AchievementCode.RUNNER_UP]: {
    title: 'Runner-up',
    description: 'Finished the season in second place.',
    category: 'competition',
    Icon: Medal
  },
  [AchievementCode.THIRD_PLACE]: {
    title: 'Third Place',
    description: 'Finished the season in third place.',
    category: 'competition',
    Icon: Medal
  },
  // attendance
  [AchievementCode.FIRST_SESSION]: {
    title: 'First Session',
    description: 'Attended a first training session.',
    category: 'attendance',
    Icon: CalendarCheck
  },
  [AchievementCode.TEN_SESSIONS]: {
    title: '10 Sessions',
    description: 'Attended 10 training sessions.',
    category: 'attendance',
    Icon: CalendarDays
  },
  [AchievementCode.PERFECT_ATTENDANCE]: {
    title: 'Perfect Attendance',
    description: 'Never missed a booked session.',
    category: 'attendance',
    Icon: Target
  },
  // club life
  [AchievementCode.FOUNDING_MEMBER]: {
    title: 'Founding Member',
    description: 'Was there when the club started.',
    category: 'club',
    Icon: Flag
  },
  [AchievementCode.MOST_IMPROVED]: {
    title: 'Most Improved',
    description: 'Made the biggest progress this season.',
    category: 'club',
    Icon: TrendingUp
  },
  [AchievementCode.MVP]: {
    title: 'MVP',
    description: 'Most valuable player of the club.',
    category: 'club',
    Icon: Star
  },
  [AchievementCode.BEST_TEAMMATE]: {
    title: 'Best Teammate',
    description: 'Voted the best teammate by the club.',
    category: 'club',
    Icon: HeartHandshake
  }
};

// A code can reach the frontend before it is added above. Show it instead of crashing.
export function getAchievementMeta(code: string): AchievementMeta {
  return (
    ACHIEVEMENTS[code as AchievementCode] ?? {
      title: code
        .toLowerCase()
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      description: '',
      category: 'club',
      Icon: Award
    }
  );
}

// Codes grouped by category, for the "award" picker
export const ACHIEVEMENT_GROUPS = (
  Object.keys(CATEGORY_LABELS) as AchievementCategory[]
).map((category) => ({
  category,
  label: CATEGORY_LABELS[category],
  codes: (Object.keys(ACHIEVEMENTS) as AchievementCode[]).filter(
    (code) => ACHIEVEMENTS[code].category === category
  )
}));