import {
  Club,
  ClubMemberStatus,
  ClubWithMembersCountAndCoachFullName,
  JoinClubResponse,
  JoinedClub,
  JoinRequestStatus,
  JoinRequestWithUser,
  MemberRole,
  Paginated,
  UserClubRank,
  UserGlobalStat,
  UserHistoryMatch,
  UserProfileData,
} from '@app/contracts/club/club.types.js';
import { rpcError } from '@app/contracts/errors.js';
import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { ClubAccessService } from './access/club-access.service.js';
import { UpdateClubDto } from '@app/contracts/club/dto/index.js';
import { User } from '@app/contracts/auth/index.js';
import { emitEvent, rpc } from '@app/common/helpers/rpc.helper.js';
import { AUTH_PATTERNS } from '@app/contracts/patterns.js';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_SERVICE, NOTIFICATION_SERVICE } from '@app/contracts/queues.js';
import { NOTIFICATION_EVENTS } from '@app/contracts/events.js';
import { NotificationEventDto } from '@app/contracts/notification/dto/index.js';
import {
  NotificationCategory,
  NotificationType,
  SenderType,
} from '@app/contracts/notification/index.js';
import { now, toFullString } from '@app/common/dates.js';
import { MatchesService } from './matches/matches.service.js';
import { AchievementsService } from './achievements/achievements.service.js';
import { CreateClubDto } from '@app/contracts/admin/dto/index.js';
import { ClubStats } from '@app/contracts/admin/admin.types.js';

import { addDays, dayOf, mondayOf, today, toDate } from '@app/common/dates.js';
import { MatchStatus } from '@app/contracts/club/club.types.js'; // adjust path
import { toSummary } from './helpers.js';

@Injectable()
export class ClubServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clubAccessService: ClubAccessService,
    private readonly achievementsService: AchievementsService,
    private readonly matchesService: MatchesService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
  ) {}

  // =========================== User Profile Data ===========================
  async getUserProfile(user_id: number): Promise<UserProfileData> {
    const joinedClubs = await this.getJoinedClubs(user_id);
    const userAchievements =
      await this.achievementsService.getUserAchievements(user_id);
    const userClubRanks = await this.UserClubRank(user_id);
    const userGlobalStats = await this.getUserGlobalStats(
      user_id,
      userClubRanks,
    );

    return {
      joined_clubs: joinedClubs,
      achievements: userAchievements,
      club_ranks: userClubRanks,
      global_stats: userGlobalStats,
    };
  }

  async getUserClubsHistory(
    user_id: number,
    page: number,
    limit: number,
    getAllMatches: boolean,
  ): Promise<Paginated<UserHistoryMatch>> {
    const activeMemberships = await this.prisma.member.findMany({
      where: { user_id, left_at: null },
      select: {
        id: true,
        club_id: true,
      },
    });

    if (activeMemberships.length === 0) {
      return { data: [], page, limit, total: 0 };
    }

    const memberIds = activeMemberships.map((m) => m.id);
    const clubIds = activeMemberships.map((m) => m.club_id);

    return this.matchesService.getUserMatches(
      user_id,
      memberIds,
      clubIds,
      page,
      limit,
      getAllMatches,
    );
  }

  async getJoinedClubs(user_id: number): Promise<JoinedClub[]> {
    const memberClubs = await this.prisma.member.findMany({
      where: { user_id, left_at: null },
      select: {
        // Club Info
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            created_at: true,
          },
        },
        // Member info in this Club
        id: true,
        role: true,
        joined_at: true,
      },
    });
    return memberClubs.map((mc: (typeof memberClubs)[0]) => ({
      club: {
        ...mc.club,
        created_at: toFullString(mc.club.created_at),
      },
      member_id: mc.id,
      role: mc.role,
      joined_at: toFullString(mc.joined_at),
    }));
  }

  async UserClubRank(user_id: number): Promise<UserClubRank[]> {
    // Fetch all leaderboard rows for this user (including tie-breaker fields)
    const userRows = await this.prisma.leaderboard.findMany({
      where: { user_id },
      select: {
        club_id: true,
        points: true,
        wins: true,
        losses: true,
        total_matches: true,
        member_id: true,
        club: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
    // Calculate the exact rank for each club
    const userClubRanks: UserClubRank[] = await Promise.all(
      userRows.map(async (row) => {
        const higherRankedCount = await this.prisma.leaderboard.count({
          where: {
            club_id: row.club_id,
            OR: [
              // Tie-breaker rules perfectly matching @@index in prisma schema
              { points: { gt: row.points } },
              { points: row.points, wins: { gt: row.wins } },
              {
                points: row.points,
                wins: row.wins,
                losses: { lt: row.losses },
              },
              {
                points: row.points,
                wins: row.wins,
                losses: row.losses,
                total_matches: { gt: row.total_matches },
              },
              {
                points: row.points,
                wins: row.wins,
                losses: row.losses,
                total_matches: row.total_matches,
                member_id: { lt: row.member_id },
              },
            ],
          },
        });

        return {
          club_id: row.club_id,
          club_name: row.club.name,
          club_slug: row.club.slug,
          points: row.points,
          rank: higherRankedCount + 1, // if no one above you, rank is 1
        };
      }),
    );

    return userClubRanks;
  }

  async getUserGlobalStats(
    user_id: number,
    userClubRanks: UserClubRank[],
  ): Promise<UserGlobalStat> {
    // Only one query needed now: aggregate the global totals
    const stats = await this.prisma.leaderboard.aggregate({
      where: { user_id },
      _sum: {
        points: true,
        wins: true,
        losses: true,
        total_matches: true,
      },
      _max: {
        win_streak: true,
      },
    });

    // Determine best rank in-memory from the already-calculated ranks
    let best_rank = null;
    if (userClubRanks.length > 0) {
      const bestClubRank = userClubRanks.reduce((best, current) => {
        // A lower numerical rank is better (Rank 1 > Rank 2)
        if (current.rank < best.rank) return current;
        // Tie-breaker: If rank is identical, pick the one with more points
        if (current.rank === best.rank && current.points > best.points)
          return current;
        return best;
      });

      best_rank = {
        club_id: bestClubRank.club_id,
        club_name: bestClubRank.club_name,
        club_slug: bestClubRank.club_slug,
        rank: bestClubRank.rank,
        points: bestClubRank.points,
      };
    }

    const wins = stats._sum.wins ?? 0;
    const losses = stats._sum.losses ?? 0;
    const points = stats._sum.points ?? 0;
    const total_matches = stats._sum.total_matches ?? 0;
    const highest_win_streak = stats._max.win_streak ?? 0;

    // 0.00% -> 100.00%
    const win_rate =
      total_matches > 0 ? Number(((wins / total_matches) * 100).toFixed(2)) : 0;

    return {
      total_matches,
      wins,
      losses,
      win_rate,
      ladder_points: points,
      current_win_streak: highest_win_streak,
      best_rank: best_rank,
    };
  }
  // ==========================================================================

  async getAllClubs(): Promise<Club[]> {
    const result = await this.prisma.club.findMany({
      orderBy: { name: 'asc' },
      where: { deleted_at: null },
    });
    return result.map((club) => ({
      ...club,
      created_at: toFullString(club.created_at),
    }));
  }

  async getClubWithMembersCountAndCoachFullName(
    clubSlug: string,
  ): Promise<ClubWithMembersCountAndCoachFullName> {
    console.log(`[ClubService] Fetching club with slug: ${clubSlug}`);
    const club = await this.clubAccessService.getClub(clubSlug);
    let coach: User | null = null;

    // get club coach full name
    const club_coach = await this.prisma.member.findFirst({
      where: { club_id: club.id, role: MemberRole.COACH, left_at: null },
    });

    if (club_coach) {
      coach = await rpc<User | null>(
        this.authClient,
        AUTH_PATTERNS.GET_USER_BY_ID,
        { user_id: club_coach.user_id },
      );
      if (!coach) {
        console.log(
          `[ClubService] User with id ${club_coach.user_id} not found for club with slug "${clubSlug}"`,
        );
      }
    } else {
      console.log(
        `[ClubService] No coach found for club with slug "${clubSlug}"`,
      );
    }

    const membersCount = await this.prisma.member.count({
      where: { club_id: club.id, left_at: null },
    });
    return {
      ...club,
      created_at: toFullString(club.created_at),
      members_count: membersCount,
      coach_full_name: coach
        ? `${coach.first_name} ${coach.last_name}`
        : 'No Coach',
    };
  }

  async getClubStatus(
    club_slug: string,
    user_id: number,
  ): Promise<ClubMemberStatus> {
    const club = await this.clubAccessService.getClub(club_slug);
    const key = { club_id_user_id: { club_id: club.id, user_id } };
    const [member, request] = await Promise.all([
      this.prisma.member.findUnique({ where: key }),
      this.prisma.joinRequest.findUnique({
        where: key,
        select: { status: true },
      }),
    ]);

    const isMember = !!member && member.left_at === null; // a user who left is not a member
    return {
      is_member: isMember,
      member_id: isMember ? member.id : null,
      role: isMember ? member.role : null,
      has_pending_request:
        !isMember && request?.status === JoinRequestStatus.PENDING,
    };
  }

  async updateClub(
    clubSlug: string,
    user_id: number,
    body: UpdateClubDto,
  ): Promise<Club> {
    const { club } = await this.clubAccessService.requireRole(
      clubSlug,
      user_id,
      MemberRole.COACH,
    ); // Ensure the user has at least COACH role to update the club

    // slug never updated, but if name is updated
    // let slug = club.slug;
    body.name = body.name?.trim();
    body.description = body.description?.trim();
    if (!body.name && !body.description) {
      throw rpcError(
        400,
        'At least one of name or description must be provided',
        'Bad Request',
      );
    }

    // if (body.name) {
    //   slug = body.name.toLowerCase().replace(/\s+/g, '-'); // Generate slug from name if provided
    // }

    // Check if the new slug already exists for another club
    // if (slug !== club.slug) {
    //   const existingClub = await this.prisma.club.findUnique({
    //     where: { slug },
    //   });
    //   if (existingClub) {
    //     throw rpcError(400, 'Club name already exists', 'Bad Request');
    //   }
    // }

    const updatedClub = await this.prisma.club.update({
      where: { id: club.id, deleted_at: null },
      data: {
        name: body.name ?? club.name,
        description: body.description ?? club.description,
        // slug,
      },
    });
    // reeeeespect, poooooooower, baNaNa, hihihi it funny, don't ask me why this comment is here, I just wanted to have some fun while coding
    return {
      ...updatedClub,
      created_at: toFullString(updatedClub.created_at),
    };
  }

  // Insane Zmiralda
  // async getClubLeaderboard(
  //   clubSlug: string,
  //   user_id: number,
  //   page: number,
  //   limit: number,
  // ): Promise<Paginated<Leaderboard>> {
  //   const { club } = await this.clubAccessService.requireRole(
  //     clubSlug,
  //     user_id,
  //     MemberRole.MEMBER,
  //   );

  //   const [members, matches] = await Promise.all([
  //     // active members, so everyone appears, even with 0 points
  //     this.prisma.member.findMany({
  //       where: { club_id: club.id, left_at: null },
  //       select: { id: true, user_id: true },
  //     }),
  //     // finished matches only
  //     this.prisma.match.findMany({
  //       where: { club_id: club.id, status: MatchStatus.FINISHED },
  //       select: {
  //         winner_id: true,
  //         team1_id: true,
  //         team2_id: true,
  //         team1_points: true,
  //         team2_points: true,
  //         team1: { select: { player1_id: true, player2_id: true } },
  //         team2: { select: { player1_id: true, player2_id: true } },
  //       },
  //     }),
  //   ]);

  //   // points, wins and losses per member id
  //   const stats = new Map<
  //     number,
  //     { points: number; wins: number; losses: number }
  //   >();
  //   const add = (memberId: number | null, points: number, won: boolean) => {
  //     if (memberId === null) return; // singles: no player 2
  //     const s = stats.get(memberId) ?? { points: 0, wins: 0, losses: 0 };
  //     s.points += points;
  //     if (won) s.wins++;
  //     else s.losses++;
  //     stats.set(memberId, s);
  //   };

  //   for (const m of matches) {
  //     for (const id of [m.team1.player1_id, m.team1.player2_id])
  //       add(id, m.team1_points, m.winner_id === m.team1_id);
  //     for (const id of [m.team2.player1_id, m.team2.player2_id])
  //       add(id, m.team2_points, m.winner_id === m.team2_id);
  //   }

  //   // order: points, then wins, then the older member first
  //   const ranked = members
  //     .map((m) => ({
  //       ...m,
  //       ...(stats.get(m.id) ?? { points: 0, wins: 0, losses: 0 }),
  //     }))
  //     .sort((a, b) => b.points - a.points || b.wins - a.wins || a.id - b.id);

  //   const pageRows = ranked.slice((page - 1) * limit, page * limit);

  //   const users = await rpc<User[]>(
  //     this.authClient,
  //     AUTH_PATTERNS.GET_USERS_BY_IDS,
  //     {
  //       user_ids: pageRows.map((r) => r.user_id),
  //     },
  //   );
  //   const userById = new Map(users.map((u) => [u.id, u]));

  //   return {
  //     data: pageRows.map((r, i) => ({
  //       rank: (page - 1) * limit + i + 1,
  //       player: { ...userById.get(r.user_id)!, member_id: r.id },
  //       points: r.points,
  //       wins: r.wins,
  //       losses: r.losses,
  //       total_matches: r.wins + r.losses,
  //       win_streak: 0, // TODO: calculate win streak
  //       best_win_streak: 0, // TODO: calculate best win streak
  //     })),
  //     page,
  //     limit,
  //     total: ranked.length,
  //   };
  // }

  async joinClub(
    club_slug: string,
    user_id: number,
  ): Promise<JoinClubResponse> {
    const club = await this.clubAccessService.getClub(club_slug);
    const member = await this.prisma.member.findUnique({
      where: { club_id_user_id: { club_id: club.id, user_id } },
    });
    if (member && member.left_at === null) {
      throw rpcError(409, 'You are already a member of this club', 'Conflict');
    }

    // 1. first time: create the row (a double click cannot create a second one)
    const created = await this.prisma.joinRequest.createMany({
      data: [{ club_id: club.id, user_id }],
      skipDuplicates: true,
    });
    let isNewRequest = created.count === 1;

    // 2. the row exists: reopen it only if it is NOT pending (a pending one keeps its place in the queue)
    if (!isNewRequest) {
      const reopened = await this.prisma.joinRequest.updateMany({
        where: {
          club_id: club.id,
          user_id,
          status: { not: JoinRequestStatus.PENDING },
        },
        data: {
          status: JoinRequestStatus.PENDING,
          requested_at: new Date(),
          decided_at: null,
          decided_by: null,
        },
      });
      isNewRequest = reopened.count === 1;
    }

    if (isNewRequest) {
      const [leaders, user] = await Promise.all([
        this.prisma.member.findMany({
          where: {
            club_id: club.id,
            role: { in: [MemberRole.LEADER, MemberRole.COACH] },
            left_at: null,
          },
          select: { user_id: true },
        }),
        rpc<User | null>(this.authClient, AUTH_PATTERNS.GET_USER_BY_ID, {
          user_id,
        }),
      ]);

      const notify_data: NotificationEventDto = {
        event_id: `${NOTIFICATION_EVENTS.JOIN_REQUESTED}:${club.id}:${user_id}`,
        sender_type: SenderType.USER,
        sender_id: String(user_id),
        sender_name: user ? `${user.first_name} ${user.last_name}` : null,
        sender_avatar_url: user?.avatar ?? null,
        category: NotificationCategory.CLUB,
        type: NotificationType.JOIN_REQUESTED,
        club_id: String(club.id),
        club_name: club.name,
        sent_at: now(),
        receiver_user_ids: leaders.map((m) => String(m.user_id)),
      };

      await emitEvent(
        this.notificationClient,
        NOTIFICATION_EVENTS.JOIN_REQUESTED,
        notify_data,
      );
    }

    return { status: 'pending' };
  }

  async cancelJoin(
    club_slug: string,
    user_id: number,
  ): Promise<{ success: true }> {
    const club = await this.clubAccessService.getClub(club_slug);
    const cancelled = await this.prisma.joinRequest.updateMany({
      where: { club_id: club.id, user_id, status: JoinRequestStatus.PENDING },
      data: { status: JoinRequestStatus.CANCELLED },
    });
    if (cancelled.count === 0) {
      throw rpcError(
        404,
        'You have no pending request for this club',
        'Not Found',
      );
    }
    return { success: true };
  }

  async getJoinRequests(
    club_slug: string,
    user_id: number,
    page: number,
    limit: number,
  ): Promise<Paginated<JoinRequestWithUser>> {
    const { club } = await this.clubAccessService.requireRole(
      club_slug,
      user_id,
      MemberRole.LEADER,
    );

    const where = { club_id: club.id, status: JoinRequestStatus.PENDING };
    const [requests, total] = await Promise.all([
      this.prisma.joinRequest.findMany({
        where,
        orderBy: [{ requested_at: 'asc' }, { id: 'asc' }], // oldest first, like a queue
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.joinRequest.count({ where }),
    ]);

    const users = requests.length
      ? await rpc<User[]>(this.authClient, AUTH_PATTERNS.GET_USERS_BY_IDS, {
          user_ids: requests.map((r) => r.user_id),
        })
      : [];
    const userById = new Map(users.map((u) => [u.id, u]));

    return {
      data: requests.map((r) => ({
        ...r,
        requested_at: r.requested_at.toISOString(),
        decided_at: r.decided_at?.toISOString() ?? null,
        user: toSummary(userById.get(r.user_id), r.user_id),
      })),
      page,
      limit,
      total,
    };
  }

  async rejectJoinRequest(
      club_slug: string,
      user_id: number,
      request_id: number,
    ): Promise<{ success: true }> {
      const { club, member } = await this.clubAccessService.requireRole(
        club_slug,
        user_id,
        MemberRole.LEADER,
      );

      const request = await this.prisma.joinRequest.findFirst({
        where: {
          id: request_id,
          club_id: club.id,
          status: JoinRequestStatus.PENDING,
        },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (!request) {
        const exists = await this.prisma.joinRequest.findFirst({
          where: { id: request_id, club_id: club.id },
          select: { id: true },
        });

        if (!exists) {
          throw rpcError(404, 'Join request not found', 'Not Found');
        }

        throw rpcError(409, 'This request was already handled', 'Conflict');
      }

      const rejected = await this.prisma.joinRequest.updateMany({
        where: {
          id: request.id,
          club_id: club.id,
          status: JoinRequestStatus.PENDING,
        },
        data: {
          status: JoinRequestStatus.REJECTED,
          decided_at: new Date(),
          decided_by: member.id,
        },
      });

      if (rejected.count === 0) {
        throw rpcError(409, 'This request was already handled', 'Conflict');
      }

      const leader = await rpc<User>(
        this.authClient,
        AUTH_PATTERNS.GET_USER_BY_ID,
        { user_id: member.user_id },
      );

      const notify_data: NotificationEventDto = {
        event_id: `${NOTIFICATION_EVENTS.JOIN_REJECTED}:${club.id}:${request.id}`,
        sender_type: SenderType.USER,
        sender_id: String(member.user_id),
        sender_name: `${leader.first_name} ${leader.last_name}`,
        sender_avatar_url: leader.avatar ?? null,
        category: NotificationCategory.CLUB,
        type: NotificationType.JOIN_REJECTED,
        club_id: String(club.id),
        club_name: club.name,
        sent_at: new Date(),
        receiver_user_ids: [String(request.user_id)],
      };

      await emitEvent(
        this.notificationClient,
        NOTIFICATION_EVENTS.JOIN_REJECTED,
        notify_data,
      );

      return { success: true };
    }
  // async rejectJoinRequest(
  //   club_slug: string,
  //   user_id: number,
  //   request_id: number,
  // ): Promise<{ success: true }> {
  //   const { club, member } = await this.clubAccessService.requireRole(
  //     club_slug,
  //     user_id,
  //     MemberRole.LEADER,
  //   );

  //   // one atomic update: only a pending request of THIS club can be rejected
  //   const rejected = await this.prisma.joinRequest.updateMany({
  //     where: {
  //       id: request_id,
  //       club_id: club.id,
  //       status: JoinRequestStatus.PENDING,
  //     },
  //     data: {
  //       status: JoinRequestStatus.REJECTED,
  //       decided_at: new Date(),
  //       decided_by: member.id,
  //     },
  //   });

  //   if (rejected.count === 0) {
  //     const exists = await this.prisma.joinRequest.findFirst({
  //       where: { id: request_id, club_id: club.id },
  //       select: { id: true },
  //     });
  //     if (!exists) throw rpcError(404, 'Join request not found', 'Not Found');
  //     throw rpcError(409, 'This request was already handled', 'Conflict');
  //   }
  //   return { success: true };
  // }

  async leaveClub(
    club_slug: string,
    user_id: number,
  ): Promise<{ success: boolean; message: string }> {
    const { club, member } = await this.clubAccessService.requireRole(
      club_slug,
      user_id,
      MemberRole.MEMBER,
    );

    // Prevent the last  coach from leaving the club
    if (member.role === MemberRole.COACH) {
      const leadersAndCoachesCount = await this.prisma.member.count({
        where: {
          club_id: club.id,
          role: MemberRole.COACH,
          left_at: null,
        },
      });

      if (leadersAndCoachesCount <= 1) {
        throw rpcError(
          400,
          ":'< You are the only coach we have, sorry i can't let you leave.",
          'Bad Request',
        );
      }
    }

    // one atomic update: only a member of THIS club can leave
    const left = await this.prisma.member.updateMany({
      where: {
        id: member.id,
        club_id: club.id,
        left_at: null, // only active members can leave
      },
      data: {
        left_at: new Date(),
      },
    });

    if (left.count === 0) {
      throw rpcError(404, 'You are not a member of this club', 'Not Found');
    }
    return { success: true, message: 'You have successfully left the club.' };
  }

  async createClub(body: CreateClubDto): Promise<Club> {
    // we already verfied the coach_user_id exists in the auth service, so we can safely create the club

    const slug = body.name.trim().toLowerCase().replace(/\s+/g, '-');

    // check if slug already exists
    const existingClub = await this.prisma.club.findUnique({
      where: { slug, deleted_at: null },
    });
    if (existingClub) {
      throw rpcError(400, 'Club name already exists', 'Bad Request');
    }
    // create the club and return it
    const club = await this.prisma.club.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
        slug: slug,
        created_at: now(),
      },
    });

    // add the coach as a member of the club
    await this.prisma.member.create({
      data: {
        club_id: club.id,
        user_id: body.coach_user_id,
        role: MemberRole.COACH,
        joined_at: now(),
      },
    });

    // TODO notify: the coach

    return { ...club, created_at: toFullString(club.created_at) };
  }

  async deleteClub(
    club_slug: string,
  ): Promise<{ success: true; message: string }> {
    const club = await this.clubAccessService.getClub(club_slug);
    // soft delete + anonymize
    await this.prisma.club.update({
      where: { id: club.id, deleted_at: null },
      data: {
        deleted_at: now(),
        name: `deleted-club-${club.name}-${club.id}`, // name is unique, so we cannot reuse it, but we can anonymize it
        description: null,
        slug: `deleted-club-${club.slug}-${club.id}`,
        avatar: null,
      },
    });

    // for club memberships, we can set left_at to now() for all members, but we don't delete the rows to keep history
    await this.prisma.member.updateMany({
      where: { club_id: club.id, left_at: null },
      data: { left_at: now() },
    });

    // TODO notify: the club's members
    return { success: true, message: 'Club deleted successfully.' };
  }

  async getClubStats(weeks: number): Promise<ClubStats> {
    const thisWeek = mondayOf(today());
    const firstWeek = addDays(thisWeek, -7 * (weeks - 1));
    const from = toDate(firstWeek);
    const to = toDate(addDays(thisWeek, 7)); // exclusive, no future weeks

    const [clubs, members, perClub, matches, bookings] = await Promise.all([
      this.prisma.club.count({ where: { deleted_at: null } }),
      this.prisma.member.count({
        where: { left_at: null, club: { deleted_at: null } },
      }),
      this.prisma.club.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { members: { where: { left_at: null } } } },
        },
      }),
      this.prisma.match.findMany({
        where: {
          scheduled_at: { gte: from, lt: to },
          status: { not: MatchStatus.CANCELLED },
          club: { deleted_at: null },
        },
        select: { scheduled_at: true },
      }),
      this.prisma.sessionAttend.findMany({
        where: {
          created_at: { gte: from, lt: to },
          session: { cancelled_at: null, club: { deleted_at: null } },
        },
        select: { created_at: true },
      }),
    ]);

    // every week starts at 0, so empty weeks still appear
    const weekly = new Map<string, { matches: number; bookings: number }>();
    for (let i = 0; i < weeks; i++) {
      weekly.set(addDays(firstWeek, 7 * i), { matches: 0, bookings: 0 });
    }

    for (const { scheduled_at } of matches) {
      const w = weekly.get(mondayOf(dayOf(scheduled_at)));
      if (w) w.matches++;
    }
    for (const { created_at } of bookings) {
      const w = weekly.get(mondayOf(dayOf(created_at)));
      if (w) w.bookings++;
    }

    return {
      clubs,
      members,
      members_per_club: perClub
        .map((c) => ({
          club_id: c.id,
          name: c.name,
          slug: c.slug,
          members_count: c._count.members,
        }))
        .sort((a, b) => b.members_count - a.members_count),
      weekly: [...weekly].map(([week_start, v]) => ({ week_start, ...v })),
    };
  }
}
