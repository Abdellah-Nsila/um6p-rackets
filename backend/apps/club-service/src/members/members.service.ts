import { Inject, Injectable } from "@nestjs/common";
import { ClubAccessService } from "../access/club-access.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { emitEvent, now, rpc, toFullString } from "@app/common";
import {
  AUTH_PATTERNS,
  AUTH_SERVICE,
  NOTIFICATION_EVENTS,
  NOTIFICATION_SERVICE,
  NotificationCategory,
  NotificationEventDto,
  NotificationType,
  rpcError,
  SenderType,
  User,
  UserGlobalStat,
  UserHistoryMatch,
  UserProfileData,
} from "@app/contracts";
import { ClientProxy } from "@nestjs/microservices";
import {
  Member,
  MemberWithUser,
  Paginated,
  MemberRole,
  JoinRequestStatus,
  JoinedClub,
  UserClubRank,
} from '@app/contracts/club/club.types.js';
import { AddMemberDto } from '@app/contracts/club/dto/index.js';
import { AchievementsService } from '../achievements/achievements.service.js';
import { MatchesService } from '../matches/matches.service.js';
import { toSummary } from '../helpers.js';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly clubAccessService: ClubAccessService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationClient: ClientProxy,
    private readonly achievementsService: AchievementsService,
    private readonly matchesService: MatchesService,
  ) {}

  async getClubMembers(
    club_slug: string,
    user_id: number,
    limit?: number,
    page?: number,
    login?: string,
    role?: number,
  ): Promise<Paginated<MemberWithUser>> {
    {
      const { club } = await this.clubAccessService.requireRole(
        club_slug,
        user_id,
        0,
      );

      if (login) {
        // send request to auth service to get user by login
        const user: User | null = await rpc<User | null>(
          this.authClient,
          AUTH_PATTERNS.GET_USER_BY_LOGIN,
          { login },
        );
        if (!user) {
          throw rpcError(
            404,
            `User with login ${login} not found`,
            "Not Found",
          );
        }
        const member = await this.prisma.member.findFirst({
          where: {
            club_id: club.id,
            user_id: user.id,
            left_at: null,
          },
        });
        if (!member) {
          throw rpcError(
            404,
            `User ${login} is not a member of club ${club_slug}`,
            "Not Found",
          );
        }
        const member_with_user_summery: MemberWithUser = {
          id: member.id,
          club_id: member.club_id,
          user_id: member.user_id,
          role: member.role,
          joined_at: String(member.joined_at),
          left_at: member.left_at ? String(member.left_at) : null,
          user: {
            id: user.id,
            login: user.login,
            first_name: user.first_name,
            last_name: user.last_name,
            department: user.department,
            avatar: user.avatar,
          },
        };

        return {
          data: [member_with_user_summery],
          total: 1,
          page: 1,
          limit: 10,
        };
      } else {
        if (!limit) limit = 10;
        if (!page) page = 1;
        // if (!role) role = 0;
        const members = await this.prisma.member.findMany({
          where: {
            club_id: club.id,
            role,
            left_at: null,
          },
          skip: (page - 1) * limit,
          take: limit,
        });

        const totalMembers = await this.prisma.member.count({
          where: {
            club_id: club.id,
            role,
            left_at: null,
          },
        });

        // TODO: send request to auth service to get user info for each member
        const ids: number[] = members.map((member) => member.user_id);
        const users: User[] = await rpc<User[]>(
          this.authClient,
          AUTH_PATTERNS.GET_USERS_BY_IDS,
          { user_ids: ids },
        );
        if (users.length != members.length) {
          console.error(
            `MembersService.getClubMembers: Mismatch in number of members and users. Members: ${members.length}, Users: ${users.length}`,
          );
        }
        const members_with_user_summery: MemberWithUser[] = members.map(
          (member) => {
            const user = users.find((user) => user.id === member.user_id);
            return {
              id: member.id,
              club_id: member.club_id,
              user_id: member.user_id,
              role: member.role,
              joined_at: toFullString(member.joined_at),
              left_at: member.left_at ? toFullString(member.left_at) : null,
              user: toSummary(user, member.user_id),
            };
          },
        );
        const filtered_members = members_with_user_summery.filter(
          (member) => member !== null,
        ) as MemberWithUser[];
        return {
          data: filtered_members,
          total: totalMembers,
          page,
          limit,
        };
      }
    }
  }

  async addClubMember(
    club_slug: string,
    user_id: number,
    body: AddMemberDto,
  ): Promise<Member> {
    const { club, member } = await this.clubAccessService.requireRole(
      club_slug,
      user_id,
      1, // Require at least admin role to add members
    );
    if (body.role && body.role > 1) {
      throw rpcError(
        400,
        `You can't update role to a higher or equal role than your own.`,
        "Bad Request",
      );
    }
    if (member && member.role == 1 && body.role == 1) {
      throw rpcError(
        400,
        `Only Coach can add another leader to the club.`,
        "Bad Request",
      );
    }

    // Check if the user is already a member of the club
    const existingMember = await this.prisma.member.findFirst({
      where: {
        club_id: club.id,
        user_id: body.user_id,
        left_at: null,
      },
    });

    if (existingMember) {
      throw rpcError(
        409,
        `User with id ${body.user_id} is already a member of club ${club_slug}`,
        "Conflict",
      );
    }

    // Check if the user exists in the auth service
    const user: User | null = await rpc<User | null>(
      this.authClient,
      AUTH_PATTERNS.GET_USER_BY_ID,
      { user_id: body.user_id },
    );
    if (!user) {
      throw rpcError(
        404,
        `User with id ${body.user_id} not found in auth service`,
        "Not Found",
      );
    }
    // add the member (or re-activate a former one) and close the user's pending request.
    // Both writes run in ONE transaction: both happen, or none.
    const [saved, accepted] = await this.prisma.$transaction([
      this.prisma.member.upsert({
        where: { club_id_user_id: { club_id: club.id, user_id: body.user_id } },
        update: { left_at: null, role: body.role ?? 0 },
        create: {
          club_id: club.id,
          user_id: body.user_id,
          role: body.role ?? 0,
        },
      }),
      this.prisma.joinRequest.updateMany({
        where: {
          club_id: club.id,
          user_id: body.user_id,
          status: JoinRequestStatus.PENDING,
        },
        data: {
          status: JoinRequestStatus.ACCEPTED,
          decided_at: new Date(),
          decided_by: member.id, // the leader who accepted
        },
      }),
    ]);

    if (accepted.count === 1) {
      const sender: User | null = await rpc<User | null>(
        this.authClient,
        AUTH_PATTERNS.GET_USER_BY_ID,
        { user_id: member.user_id },
      );

      const notify_data: NotificationEventDto = {
        event_id: `${NOTIFICATION_EVENTS.JOIN_ACCEPTED}:${club.id}:${body.user_id}`,
        sender_type: SenderType.USER,
        sender_id: String(member.user_id),
        sender_name: sender
          ? `${sender.first_name} ${sender.last_name}`
          : null,
        sender_avatar_url: sender?.avatar ?? null,
        category: NotificationCategory.CLUB,
        type: NotificationType.JOIN_ACCEPTED,
        club_id: String(club.id),
        club_name: club.name,
        sent_at: now(),
        receiver_user_ids: [String(body.user_id)],
      };

      await emitEvent(
        this.notificationClient,
        NOTIFICATION_EVENTS.JOIN_ACCEPTED,
        notify_data,
      );
    }
    console.log(
      `[MemberService] leader ${member.user_id} Added member with user_id ${body.user_id} to club ${club_slug} with role ${body.role ?? 0}`,
    );

    return {
      ...saved,
      joined_at: toFullString(saved.joined_at),
      left_at: saved.left_at ? toFullString(saved.left_at) : null,
    };
  }

  async updateClubMemberRole(
    club_slug: string,
    user_id: number,
    body: { role: 0 | 1 },
    member_id: number,
  ): Promise<Member> {
    const { club, member } = await this.clubAccessService.requireRole(
      club_slug,
      user_id,
      2, // Require at least admin role to update member roles
    );

    if (body.role >= member.role) {
      throw rpcError(
        400,
        `You can't update role to a higher or equal role than your own.`,
        "Bad Request",
      );
    }
    // Check if the member exists in the club
    const existingMember = await this.prisma.member.findFirst({
      where: {
        id: member_id,
        club_id: club.id,
        left_at: null,
      },
    });

    if (!existingMember) {
      throw rpcError(
        404,
        `Member with id ${member_id} not found in club ${club_slug}`,
        "Not Found",
      );
    }

    // check if member role already has the same role as the new role
    if (existingMember.role === body.role) {
      throw rpcError(
        400,
        `Member with id ${member_id} already has the role ${body.role}`,
        "Bad Request",
      );
    }

    // you can't less role of a member who has a higher or equal role than you
    if (existingMember.role >= member.role) {
      throw rpcError(
        400,
        `You can't change the role of a member who has a higher or equal role than your own.`,
        "Bad Request",
      );
    }

    // Update the member's role
    const updatedMember = await this.prisma.member.update({
      where: {
        id: member_id,
      },
      data: {
        role: body.role,
      },
    });

    return {
      ...updatedMember,
      joined_at: toFullString(updatedMember.joined_at),
      left_at: updatedMember.left_at
        ? toFullString(updatedMember.left_at)
        : null,
    };
  }

  async removeClubMember(
    club_slug: string,
    user_id: number,
    member_id: number,
  ) {
    const { club, member } = await this.clubAccessService.requireRole(
      club_slug,
      user_id,
      MemberRole.LEADER, // Require at least leader role to remove members
    );
    // get the member to be removed
    const memberToRemove = await this.prisma.member.findFirst({
      where: {
        id: member_id,
        club_id: club.id,
        left_at: null,
      },
    });

    if (!memberToRemove) {
      throw rpcError(
        404,
        `Member with id ${member_id} not found in club ${club_slug}`,
        "Not Found",
      );
    }

    // you can't remove a member who has a higher or equal role than you
    if (memberToRemove.role >= member.role) {
      throw rpcError(
        400,
        `You can't remove a member who has a higher or equal role than your own.`,
        "Bad Request",
      );
    }

    // Set the left_at timestamp to mark the member as removed
    const updatedMember = await this.prisma.member.update({
      where: {
        id: member_id,
        club_id: club.id,
      },
      data: {
        left_at: now(),
      },
    });

    // FEAT_TO_ADD: (its not problem right now) remove member attendance from future sessions

    return {
      status: 204,
      message: `Member with id ${member_id} has been removed from club ${club_slug}`,
    };
  }

  // =========================== User Profile Data ===========================
  async getUserProfile(user_id: number): Promise<UserProfileData> {
    const joinedClubs = await this.getUserJoinedClubs(user_id);
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

  async getUserClubsMatchesHistory(
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

  async getUserJoinedClubs(user_id: number): Promise<JoinedClub[]> {
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

  async whenUserDeleted(
    user_id: number,
  ): Promise<{ status: number; message: string }> {
    // 1. get all memberships of the user, with role and club_id, where left_at is null
    const memberships = await this.prisma.member.findMany({
      where: {
        user_id: user_id,
        left_at: null,
      },
      select: {
        id: true,
        club_id: true,
        role: true,
      },
    });

    // 2. if the user is coach set oldest leader to coach, if no leader, set oldest member to coach, if no member, do nothing
    for (const membership of memberships) {
      if (membership.role === MemberRole.COACH) {
        const oldestLeader = await this.prisma.member.findFirst({
          where: {
            club_id: membership.club_id,
            role: MemberRole.LEADER,
            left_at: null,
          },
          orderBy: {
            joined_at: 'asc',
          },
        });

        if (oldestLeader) {
          await this.prisma.member.update({
            where: {
              id: oldestLeader.id,
            },
            data: {
              role: MemberRole.COACH,
            },
          });
        } else {
          const oldestMember = await this.prisma.member.findFirst({
            where: {
              club_id: membership.club_id,
              role: MemberRole.MEMBER,
              left_at: null,
            },
            orderBy: {
              joined_at: 'asc',
            },
          });

          if (oldestMember) {
            await this.prisma.member.update({
              where: {
                id: oldestMember.id,
              },
              data: {
                role: MemberRole.COACH,
              },
            });
          }
        }
      }
    }

    // 3. set left_at for all memberships of the user to now()
    await this.prisma.member.updateMany({
      where: {
        user_id: user_id,
        left_at: null,
      },
      data: {
        left_at: now(),
      },
    });

    // 4. set status of all pending join requests of the user to cancelled
    await this.prisma.joinRequest.updateMany({
      where: {
        user_id: user_id,
        status: JoinRequestStatus.PENDING,
      },
      data: {
        status: JoinRequestStatus.CANCELLED,
        decided_at: now(),
      },
    });

    return {
      status: 204,
      message: `User with id ${user_id} has been removed from all clubs and their pending join requests have been cancelled.`,
    };
  }
}
