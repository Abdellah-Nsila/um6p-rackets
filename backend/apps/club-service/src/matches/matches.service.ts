import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClientProxy } from '@nestjs/microservices';
import { ClubAccessService } from '../access/club-access.service.js';
import { AUTH_SERVICE, MatchMode, rpcError } from '@app/contracts';
import {
  MatchesQueryDto,
  MatchRequestDto,
  MatchResultDto,
} from '@app/contracts/club/dto/index.js';
import {
  MatchDetail,
  MatchMineFilter,
  MatchStatus,
  MemberRole,
  Paginated,
  UserHistoryMatch,
} from '@app/contracts/club/index.js';
import { rankingFunction, toFullString } from '@app/common';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';
import { Prisma } from '../generated/prisma/client.js';
import {
  loadPlayers,
  matchInclude,
  matchMembers,
  playerWhere,
  STATUS_FILTER,
  toMatchDetail,
} from '../helpers.js';

const memberSelect = { select: { id: true, user_id: true } } as const;
const teamInclude = {
  include: { player1: memberSelect, player2: memberSelect },
} as const;

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly clubAccessService: ClubAccessService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  async requestMatch(
    slug: string,
    user_id: number,
    body: MatchRequestDto,
  ): Promise<{ status: number; message: string; pending_match_id: number }> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    ); // 0 = MEMBER role

    // schedule at must be in the future
    const scheduledAt = new Date(body.scheduled_at);
    if (scheduledAt <= new Date()) {
      throw rpcError(
        400,
        'Scheduled time must be in the future',
        'Bad Request',
      );
    }
    // check mode and number of players
    if (body.mode === MatchMode.SINGLES && body.opponent_ids.length !== 1) {
      throw rpcError(
        400,
        'Singles match must have exactly 1 opponent',
        'Bad Request',
      );
    } else if (
      body.mode === MatchMode.DOUBLES &&
      body.opponent_ids.length !== 2
    ) {
      throw rpcError(
        400,
        'Doubles match must have exactly 2 opponents',
        'Bad Request',
      );
    } else if (body.mode === MatchMode.DOUBLES && !body.partner_id) {
      throw rpcError(400, 'Doubles match must have a partner', 'Bad Request');
    } else if (body.mode === MatchMode.SINGLES && body.partner_id) {
      throw rpcError(400, 'Singles match cannot have a partner', 'Bad Request');
    }

    // check that the players are not the same
    const allPlayerIds = [
      member.id,
      body.partner_id,
      ...body.opponent_ids,
    ].filter((id): id is number => id !== undefined);
    const uniquePlayerIds = new Set(allPlayerIds);
    if (uniquePlayerIds.size !== allPlayerIds.length) {
      throw rpcError(400, 'Players must be unique', 'Bad Request');
    }

    // validate that the partner_id is a member of the club if provided
    if (body.partner_id) {
      const partnerMember = await this.prisma.member.findFirst({
        where: {
          club_id: club.id,
          id: body.partner_id,
          left_at: null, // ensure the partner is an active member
        },
      });

      if (!partnerMember) {
        throw rpcError(404, 'Partner is not a member of the club', 'Not Found');
      }
    }
    // Validate that the opponents are members of the same club
    const opponentMembers = await this.prisma.member.findMany({
      where: {
        club_id: club.id,
        id: { in: body.opponent_ids },
        left_at: null, // ensure the opponents are active members
      },
      select: { id: true }, // only select the id to minimize data transfer
    });

    if (opponentMembers.length !== body.opponent_ids.length) {
      throw rpcError(
        404,
        'One or more opponents are not members of the club',
        'Not Found',
      );
    }

    // create team 1
    const team1 = await this.prisma.team.create({
      data: {
        club_id: club.id,
        player1_id: member.id,
        player2_id: body.partner_id || null,
      },
    });

    // create team 2
    const team2 = await this.prisma.team.create({
      data: {
        club_id: club.id,
        player1_id: body.opponent_ids[0],
        player2_id: body.opponent_ids[1] || null,
      },
    });

    // Create the pending match request in the database
    const pendingMatch = await this.prisma.match.create({
      data: {
        club_id: club.id,
        team1_id: team1.id,
        team2_id: team2.id,
        mode: body.mode,
        status: MatchStatus.PENDING,
        location: body.location || null,
        scheduled_at: new Date(body.scheduled_at),
      },
    });

    return {
      status: 200,
      message: 'Match request created successfully',
      pending_match_id: pendingMatch.id,
    };
  }

  async getMatches(
    slug: string,
    user_id: number,
    query: MatchesQueryDto,
  ): Promise<Paginated<MatchDetail>> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );

    const isPlayer = playerWhere(member.id);
    const and: Prisma.MatchWhereInput[] = [];

    if (query.status && query.status !== 'all') {
      and.push({ status: STATUS_FILTER[query.status] });
    }
    // a plain member can't see other members' pending matches
    if (query.status === 'pending' && member.role === MemberRole.MEMBER) {
      and.push(isPlayer);
    }
    if (query.mine === MatchMineFilter.PLAYER) and.push(isPlayer);
    if (query.mine === MatchMineFilter.REFEREE) and.push({ ref_id: member.id });
    if (query.mine === MatchMineFilter.ANY) {
      and.push({ OR: [isPlayer, { ref_id: member.id }] });
    }

    const where: Prisma.MatchWhereInput = { club_id: club.id, AND: and };

    const [total, matches] = await Promise.all([
      this.prisma.match.count({ where }),
      this.prisma.match.findMany({
        where,
        include: matchInclude,
        // completed: latest first, otherwise soonest first
        orderBy: {
          scheduled_at: query.status === 'completed' ? 'desc' : 'asc',
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const toPlayer = await loadPlayers(this.authClient, matches);

    return {
      data: matches.map((m) => toMatchDetail(m, toPlayer)),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async getUserMatches(
    user_id: number,
    member_ids: number[],
    club_ids: number[],
    page: number,
    limit: number,
    fetchAll = false,
  ): Promise<Paginated<UserHistoryMatch>> {
    const where: Prisma.MatchWhereInput = {
      club_id: { in: club_ids },
      status: MatchStatus.FINISHED,
      ...playerWhere(member_ids),
    };

    // prisma ignores undefined skip/take
    const [matches, total] = await this.prisma.$transaction([
      this.prisma.match.findMany({
        where,
        include: matchInclude,
        orderBy: { scheduled_at: 'desc' },
        skip: fetchAll ? undefined : (page - 1) * limit,
        take: fetchAll ? undefined : limit,
      }),
      this.prisma.match.count({ where }),
    ]);

    if (matches.length === 0) return { data: [], page, limit, total };

    const toPlayer = await loadPlayers(this.authClient, matches);

    const data: UserHistoryMatch[] = matches.map((m) => {
      const isTeam1 =
        m.team1.player1.user_id === user_id ||
        m.team1.player2?.user_id === user_id;
      const [myTeam, otherTeam] = isTeam1
        ? [m.team1, m.team2]
        : [m.team2, m.team1];
      const my_score = isTeam1 ? m.team1_score : m.team2_score;
      const opponent_score = isTeam1 ? m.team2_score : m.team1_score;

      // partner only in doubles
      const partnerMember =
        m.mode === MatchMode.DOUBLES && myTeam.player2
          ? myTeam.player1.user_id === user_id
            ? myTeam.player2
            : myTeam.player1
          : null;

      return {
        match_id: m.id,
        club_id: m.club_id,
        club_name: m.club.name,
        club_slug: m.club.slug,
        mode: m.mode,
        partner: partnerMember ? toPlayer(partnerMember) : null,
        opponents: [otherTeam.player1, otherTeam.player2]
          .flatMap((p) => (p ? [p] : []))
          .map(toPlayer),
        result: my_score > opponent_score ? 'W' : 'L',
        my_score,
        opponent_score,
        points_change: rankingFunction(my_score, opponent_score),
        date: toFullString(m.scheduled_at),
      };
    });

    return {
      data,
      page: fetchAll ? 1 : page,
      limit: fetchAll ? total : limit,
      total,
    };
  }

  async getMatch(
    slug: string,
    user_id: number,
    match_id: number,
  ): Promise<MatchDetail> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );

    const match = await this.prisma.match.findUnique({
      where: { club_id: club.id, id: match_id },
      include: matchInclude,
    });
    if (!match) throw rpcError(404, 'Match not found', 'Not Found');

    // a plain member cannot see a pending match they are not part of
    const isInMatch = matchMembers(match).some((m) => m.id === member.id);
    if (
      !isInMatch &&
      member.role === MemberRole.MEMBER &&
      match.status === MatchStatus.PENDING
    ) {
      throw rpcError(
        403,
        'You do not have permission to view this match',
        'Forbidden',
      );
    }

    const toPlayer = await loadPlayers(this.authClient, [match]);
    return toMatchDetail(match, toPlayer);
  }

  async acceptMatch(
    slug: string,
    user_id: number,
    match_id: number,
  ): Promise<{ status: number; message: string }> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    const match = await this.prisma.match.findUnique({
      where: { club_id: club.id, id: match_id },
      include: {
        team1: teamInclude,
        team2: teamInclude,
      },
    });
    if (!match) throw rpcError(404, 'Match not found', 'Not Found');

    if (match.status !== MatchStatus.PENDING) {
      throw rpcError(
        400,
        'Only pending matches can be accepted',
        'Bad Request',
      );
    }

    // if (match.scheduled_at <= new Date()) {
    //   throw rpcError(
    //     422,
    //     'Cannot accept a match whose scheduled time has already passed',
    //     'Unprocessable Entity',
    //   );
    // }

    // leader+ can't accept a match that they are part of
    const isInMatch =
      match.team1.player1_id === member.id ||
      match.team1.player2_id === member.id ||
      match.team2.player1_id === member.id ||
      match.team2.player2_id === member.id;

    if (isInMatch) {
      throw rpcError(
        403,
        'You cannot accept a match that you are part of',
        'Forbidden',
      );
    }

    // accept the match
    await this.prisma.match.update({
      where: { club_id: club.id, id: match_id },
      data: { status: MatchStatus.CONFIRMED, ref_id: member.id },
    });

    return { status: 200, message: 'Match accepted successfully' };
  }

  async cancelMatch(
    slug: string,
    user_id: number,
    match_id: number,
  ): Promise<{ status: number; message: string }> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );

    const match = await this.prisma.match.findUnique({
      where: { club_id: club.id, id: match_id },
      include: {
        team1: teamInclude,
        team2: teamInclude,
      },
    });

    if (!match) throw rpcError(404, 'Match not found', 'Not Found');

    if (match.status === MatchStatus.CANCELLED) {
      throw rpcError(400, 'Match is already cancelled', 'Bad Request');
    }

    if (match.status === MatchStatus.FINISHED) {
      throw rpcError(
        400,
        'Finished matches cannot be cancelled',
        'Bad Request',
      );
    }

    // only the players in the match or a leader can cancel the match
    const isInMatch =
      match.team1.player1_id === member.id ||
      match.team1.player2_id === member.id ||
      match.team2.player1_id === member.id ||
      match.team2.player2_id === member.id;

    if (!isInMatch && member.role < MemberRole.LEADER) {
      throw rpcError(
        403,
        'You do not have permission to cancel this match',
        'Forbidden',
      );
    }

    // if the match is confirmed, only a leader+ can cancel it
    if (
      match.status === MatchStatus.CONFIRMED &&
      member.role < MemberRole.LEADER
    ) {
      throw rpcError(
        403,
        'Only a leader can cancel a confirmed match',
        'Forbidden',
      );
    }

    // cancel the match
    await this.prisma.match.update({
      where: { club_id: club.id, id: match_id },
      data: {
        status: MatchStatus.CANCELLED,
        cancelled_at: new Date(),
        cancelled_by: member.id,
      },
    });

    return { status: 200, message: 'Match cancelled successfully' };
  }

  async submitMatchResult(
    slug: string,
    user_id: number,
    match_id: number,
    result: MatchResultDto,
  ): Promise<{ status: number; message: string }> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );

    const match = await this.prisma.match.findUnique({
      where: { club_id: club.id, id: match_id },
      include: {
        team1: teamInclude,
        team2: teamInclude,
      },
    });

    if (!match) throw rpcError(404, 'Match not found', 'Not Found');
    if (match.status !== MatchStatus.CONFIRMED) {
      throw rpcError(
        400,
        'Only confirmed matches can have results submitted',
        'Bad Request',
      );
    }
    if (match.ref_id !== member.id) {
      throw rpcError(
        403,
        'You do not have permission to submit the result for this match',
        'Forbidden',
      );
    }

    let winner_id: number | null = null;
    if (result.team1_score > result.team2_score) winner_id = match.team1.id;
    else if (result.team2_score > result.team1_score)
      winner_id = match.team2.id;

    const team1_points = rankingFunction(
      result.team1_score,
      result.team2_score,
    );
    const team2_points = rankingFunction(
      result.team2_score,
      result.team1_score,
    );

    // We need transaction for this proccess
    await this.prisma.$transaction(async (tx) => {
      // 1. Update the match
      await tx.match.update({
        where: { club_id: club.id, id: match_id },
        data: {
          team1_score: result.team1_score,
          team2_score: result.team2_score,
          team1_points,
          team2_points,
          winner_id: winner_id,
          status: MatchStatus.FINISHED,
        },
      });
      // Update the leaderboard for both teams
      await this.leaderboardService.updateLeaderboard(
        tx,
        club.id,
        match.team1.id,
        match.team2.id,
        team1_points,
        team2_points,
        winner_id,
      );
    });

    return { status: 200, message: 'Match result submitted successfully' };
  }
}
