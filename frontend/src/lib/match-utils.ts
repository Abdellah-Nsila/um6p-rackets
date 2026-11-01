import type { MatchDetail, Player, TeamWithPlayers } from "@/types/contracts/club";

import { APP_TIME_ZONE } from "@/lib/date-utils";

// Seeded users can have no first or last name: fall back to the login
export function playerName(player: Player | null | undefined) {
  if (!player) return "";
  const fullName = `${player.login ?? ""}`.trim();
  return fullName || player.login;
}

// "Bijo om ali & mamamiya ya bladi" (or one name for singles)
export function teamNames(team: TeamWithPlayers) {
  return [team.player1, team.player2].map(playerName).filter(Boolean).join(" & ");
}

function isInTeam(team: TeamWithPlayers, memberId: number) {
  return team.player1.member_id === memberId || team.player2?.member_id === memberId;
}

// Which side the member plays on, or null if he is not in the match
export function getMySide(match: MatchDetail, memberId: number): "team1" | "team2" | null {
  if (isInTeam(match.team1, memberId)) return "team1";
  if (isInTeam(match.team2, memberId)) return "team2";
  return null;
}

// Dates and times always use the app time zone, not the browser one
export const formatMatchDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: APP_TIME_ZONE }).format(
    new Date(iso),
  );

export const formatMatchTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso));
