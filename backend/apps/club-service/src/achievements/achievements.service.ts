import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_PATTERNS, AUTH_SERVICE, rpcError, User } from '@app/contracts';
import { ClubAccessService } from '../access/club-access.service.js';
import {
  Achievement,
  AchievementWithUser,
  MemberRole,
  Paginated,
} from '@app/contracts/club/club.types.js';
import { now, rpc, toFullString } from '@app/common';
import { CreateAchievementDto } from '@app/contracts/club/dto/index.js';
import { toSummary } from '../helpers.js';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly clubAccessService: ClubAccessService,
  ) {}

  async getClubAchievements(
    slug: string,
    user_id: number,
    page: number,
    limit: number,
  ): Promise<Paginated<AchievementWithUser>> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );
    const achievements = await this.prisma.achievement.findMany({
      where: { club_id: club.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { taken_at: 'desc' },
    });
    const total = await this.prisma.achievement.count({
      where: { club_id: club.id },
    });

    const user_ids = achievements.map((achievement) => achievement.user_id);
    const users =
      user_ids.length > 0
        ? await rpc<User[]>(this.authClient, AUTH_PATTERNS.GET_USERS_BY_IDS, {
            user_ids: user_ids,
          })
        : [];

    const userMap = new Map(users.map((user) => [user.id, user]));

    const achievementsWithUser: AchievementWithUser[] = achievements.map(
      (achievement) => ({
        ...achievement,
        code: achievement.code as Achievement['code'],
        taken_at: toFullString(achievement.taken_at),
        user: toSummary(userMap.get(achievement.user_id), achievement.user_id),
      }),
    );

    // this will send server error in case of

    return {
      data: achievementsWithUser,
      page,
      limit,
      total,
    };
  }

  async getUserAchievements(user_id: number): Promise<Achievement[]> {
    const achievements = await this.prisma.achievement.findMany({
      where: { user_id },
      orderBy: { taken_at: 'desc' },
    });
    return achievements.map((achievement) => ({
      ...achievement,
      code: achievement.code as Achievement['code'],
      taken_at: toFullString(achievement.taken_at),
    }));
  }

  async createAchievement(
    slug: string,
    user_id: number,
    body: CreateAchievementDto,
  ): Promise<Achievement> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    // check if body.user_id is member of the club
    const member = await this.clubAccessService.findMember(
      club.id,
      body.user_id,
    );
    if (!member) {
      throw rpcError(400, 'User is not a member of the club', 'Not Found');
    }

    const achievement = await this.prisma.achievement.create({
      data: {
        club_id: club.id,
        user_id: body.user_id,
        code: body.code,
        awarded_by: user_id,
        taken_at: now(),
      },
    });
    return {
      ...achievement,
      code: achievement.code as Achievement['code'],
      taken_at: toFullString(achievement.taken_at),
    };
  }

  async deleteAchievement(
    slug: string,
    user_id: number,
    achievement_id: number,
  ): Promise<{ status: number; message: string }> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievement_id, club_id: club.id },
    });
    if (!achievement) {
      throw rpcError(404, 'Achievement not found', 'Not Found');
    }

    await this.prisma.achievement.delete({
      where: { id: achievement_id },
    });

    return { status: 200, message: 'Achievement deleted successfully' };
  }
}
