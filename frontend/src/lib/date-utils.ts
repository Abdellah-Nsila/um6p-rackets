// The app runs on Casablanca time. Never use the browser time zone for sessions or matches.
export const APP_TIME_ZONE = "UTC"; // "Africa/Casablanca" is not supported in all browsers, so we use UTC and adjust the time accordingly.

const format = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIME_ZONE, ...options });

export const now = () => new Date();

// Safely parse ISO strings that might be missing the Z
export const formatTime = (iso: string) => {
  const safeIso = iso.endsWith("Z") ? iso : `${iso}Z`;
  return format({ hour: "2-digit", minute: "2-digit" }).format(new Date(safeIso));
};

// "Mon"
export const formatWeekday = (iso: string) => format({ weekday: "short" }).format(new Date(iso));

// "24 Oct"
export const formatDayMonth = (iso: string) =>
  format({ day: "numeric", month: "short" }).format(new Date(iso));

// Today as "YYYY-MM-DD" in the app time zone
export const todayInAppZone = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(new Date());

// Add days to a "YYYY-MM-DD" date
export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// The Monday of the week of a "YYYY-MM-DD" date (weeks run Monday to Sunday)
export function mondayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = Sunday
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}
