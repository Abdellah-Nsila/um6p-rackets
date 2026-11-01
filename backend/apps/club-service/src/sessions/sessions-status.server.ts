import { SessionState } from "@app/contracts/club/club.types.js";

export function sessionState(
  session: { start_at: Date; end_at: Date; cancelled_at: Date | null; capacity: number },
  attendsCount: number,
  now: Date = new Date(),
): SessionState {
  if (session.cancelled_at) return 'cancelled';
  if (session.end_at <= now) return 'past';
  if (session.start_at <= now) return 'ongoing';
  if (attendsCount >= session.capacity) return 'full';
  return 'open';
}
