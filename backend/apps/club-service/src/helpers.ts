import {
  AUTH_PATTERNS,
  MatchDetail,
  MatchStatus,
  Player,
  TeamWithPlayers,
  User,
  UserSummary,
} from '@app/contracts';
import { Prisma } from './generated/prisma/client.js';
import { ClientProxy } from '@nestjs/microservices';
import { rpc, toFullString } from '@app/common';

export const STATUS_FILTER: Record<string, MatchStatus> = {
  pending: MatchStatus.PENDING,
  upcoming: MatchStatus.CONFIRMED,
  completed: MatchStatus.FINISHED,
  cancelled: MatchStatus.CANCELLED,
};

// shown when the auth service no longer returns the user (deleted account)
export const unknownUser = (id: number): UserSummary => ({
  id,
  login: 'unknown',
  first_name: 'Unknown',
  last_name: 'user',
  avatar: null,
  department: null,
});

// only the summary fields: User also has email and phone, which a leader should not get here
export const toSummary = (
  u: User | undefined,
  user_id: number = 0,
): UserSummary =>
  !u
    ? unknownUser(user_id)
    : {
        id: u.id,
        login: u.login,
        first_name: u.first_name,
        last_name: u.last_name,
        avatar: u.avatar,
        department: u.department,
      };

export const memberSelect = { select: { id: true, user_id: true } } as const;
export const teamInclude = {
  include: { player1: memberSelect, player2: memberSelect },
} as const;

export const matchInclude = {
  club: { select: { id: true, name: true, slug: true } },
  team1: teamInclude,
  team2: teamInclude,
  referee: memberSelect,
} as const;

export type MatchRow = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;
type MemberRef = { id: number; user_id: number };

// matches where one of these members plays (accepts one id or many)
export const playerWhere = (
  memberIds: number | number[],
): Prisma.MatchWhereInput => {
  const id = { in: [memberIds].flat() };
  return {
    OR: [
      { team1: { player1_id: id } },
      { team1: { player2_id: id } },
      { team2: { player1_id: id } },
      { team2: { player2_id: id } },
    ],
  };
};

// everyone in a match: up to 4 players and the referee
export const matchMembers = (m: MatchRow): MemberRef[] =>
  [
    m.team1.player1,
    m.team1.player2,
    m.team2.player1,
    m.team2.player2,
    m.referee,
  ].flatMap((x) => (x ? [x] : []));

// one auth call for all matches, returns a member -> Player mapper
export async function loadPlayers(
  authClient: ClientProxy,
  matches: MatchRow[],
) {
  const userIds = [
    ...new Set(matches.flatMap(matchMembers).map((m) => m.user_id)),
  ];
  const users = userIds.length
    ? await rpc<User[]>(authClient, AUTH_PATTERNS.GET_USERS_BY_IDS, {
        user_ids: userIds,
      })
    : [];
  const userById = new Map(users.map((u) => [u.id, u]));

  return (m: MemberRef): Player => {
    return {
      ...toSummary(userById.get(m.user_id), m.user_id),
      member_id: m.id,
    };
  };
}

export type ToPlayer = Awaited<ReturnType<typeof loadPlayers>>;

export function toMatchDetail(m: MatchRow, toPlayer: ToPlayer): MatchDetail {
  const toTeam = (t: MatchRow['team1']): TeamWithPlayers => ({
    ...t,
    player1: toPlayer(t.player1),
    player2: t.player2 ? toPlayer(t.player2) : null,
    created_at: toFullString(t.created_at),
  });

  return {
    ...m,
    team1: toTeam(m.team1),
    team2: toTeam(m.team2),
    referee: m.referee ? toPlayer(m.referee) : null,
    scheduled_at: toFullString(m.scheduled_at),
    cancelled_at: m.cancelled_at ? toFullString(m.cancelled_at) : null,
    created_at: toFullString(m.created_at),
  };
}
