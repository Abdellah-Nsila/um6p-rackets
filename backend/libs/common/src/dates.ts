// libs/common/src/dates.ts
export const APP_TIMEZONE = 'Africa/Casablanca';

   const UTC_OFFSET_HOURS = 0; // UTC+0 for Casablanca, Morocco , we return to UTC+0 in sep 20 2026, put it 1 to change it to UTC+1 ..
   const OFFSET = `${UTC_OFFSET_HOURS < 0 ? '-' : '+'}${String(Math.abs(UTC_OFFSET_HOURS)).padStart(2, '0')}:00`;
   const OFFSET_MS = UTC_OFFSET_HOURS * 60 * 60_000;
   const DAY_MS = 86_400_000;

// ---------- days ("YYYY-MM-DD") ----------

// day of a moment: 2026-10-12T16:30Z -> "2026-10-12"
export const dayOf = (date: Date): string =>
  new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 10);

// today
export const today = (): string => dayOf(new Date());

// now
export const now = (): Date => new Date();

// from date to full string date: 2026-10-12T16:30Z -> "2026-10-12T16:30"
export const toFullString = (date: Date): string =>
  new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);

// "2026-10-12" + 7 -> "2026-10-19"
export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

// 0 Monday ... 6 Sunday (same as the WeekDay enum)
export const weekdayOf = (day: string): number =>
  (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;

export const mondayOf = (day: string): string => addDays(day, -weekdayOf(day));

// real calendar date, not only the right shape (rejects "2026-13-45")
export function isValidDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day;
}

// ---------- moments (Date) ----------

// the real moment day + time: ("2026-10-12", "17:30") -> Date
export const toDate = (day: string, hhmm = '00:00'): Date => new Date(`${day}T${hhmm}:00${OFFSET}`);

// to date from string
export const toDateFromString = (s: string): Date => new Date(s);

// start and end of a week. No `week` = the current week.
export function weekRange(week?: string) {
  const weekStart = mondayOf(week ?? today());
  return {
    weekStart, // "2026-10-12"
    from: toDate(weekStart),
    to: toDate(addDays(weekStart, 7)), // exclusive
  };
}

// ---------- times ("HH:mm") ----------

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// "HH:mm" from a Prisma @db.Time value (the 1970-01-01 part is ignored)
export const timeOfDay = (t: Date): string =>
  `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;

// "HH:mm" -> Date for a @db.Time column
export const toTime = (hhmm: string): Date => new Date(`1970-01-01T${hhmm}:00.000Z`);

// minutes between two times, an earlier end means the next day
// ("22:00","00:30" -> 150). Equal times return 0, so reject them in the service.
export function durationMinutes(start: string, end: string): number {
  const diff = toMinutes(end) - toMinutes(start);
  return diff < 0 ? diff + 1440 : diff;
}

// end moment of a session: start + duration
export const addMinutes = (date: Date, minutes: number): Date =>
  new Date(date.getTime() + minutes * 60_000);