import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_PATTERNS, AUTH_SERVICE, NOTIFICATION_EVENTS, NOTIFICATION_SERVICE, NotificationCategory, NotificationEventDto, NotificationType, rpcError, SenderType, User } from '@app/contracts';
import { ClubAccessService } from '../access/club-access.service.js';
import {
  AnnouncementWithAuthor,
  MemberRole,
  Paginated,
} from '@app/contracts/club/club.types.js';
import { emitEvent, rpc, toFullString } from '@app/common';
import { rpc, toFullString } from '@app/common';
import { toSummary } from '../helpers.js';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly clubAccessService: ClubAccessService,
    @Inject(NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy,
  ) {}

  async getClubAnnouncements({
    slug,
    user_id,
    page,
    limit,
  }: {
    slug: string;
    user_id: number;
    page: number;
    limit: number;
  }): Promise<Paginated<AnnouncementWithAuthor>> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );

    const where = { club_id: club.id };

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    const members = await this.prisma.member.findMany({
      where: {
        club_id: club.id,
        id: { in: [...new Set(announcements.map((a) => a.announcer_id))] },
      },
    });

    const users = await rpc<User[]>(
      this.authClient,
      AUTH_PATTERNS.GET_USERS_BY_IDS,
      {
        user_ids: members.map((m) => m.user_id),
      },
    );

    const memberById = new Map(members.map((m) => [m.id, m]));
    const userById = new Map(users.map((u) => [u.id, u]));

    const data = announcements.map((announcement) => {
      const member = memberById.get(announcement.announcer_id);
      const user = member && userById.get(member.user_id);

      return {
        ...announcement,
        created_at: toFullString(announcement.created_at),
        announcer: {
          ...toSummary(user, member?.user_id),
          member_id: announcement.announcer_id,
        },
      };
    });

    return { data, page, limit, total };
  }

  async createAnnouncement({
    slug,
    user_id,
    description,
  }: {
    slug: string;
    user_id: number;
    description: string;
  }): Promise<AnnouncementWithAuthor> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    const announcement = await this.prisma.announcement.create({
      data: {
        club_id: club.id,
        announcer_id: member.id,
        description,
      },
    });

    const [announcerUser, clubMembers] = await Promise.all([
      rpc<User>(
        this.authClient,
        AUTH_PATTERNS.GET_USER_BY_ID,
        { user_id: member.user_id },
      ),
      this.prisma.member.findMany({
        where: {
          club_id: club.id,
          left_at: null,
        },
        select: {
          user_id: true,
        },
      }),
    ]);

    const notify_data: NotificationEventDto = {
      event_id: `${NOTIFICATION_EVENTS.CLUB_ANNOUNCEMENT}:${club.id}:${announcement.id}`,
      sender_type: SenderType.USER,
      sender_id: String(member.user_id),
      sender_name: `${announcerUser.first_name} ${announcerUser.last_name}`,
      sender_avatar_url: announcerUser.avatar ?? null,
      category: NotificationCategory.CLUB,
      type: NotificationType.CLUB_ANNOUNCEMENT,
      club_id: String(club.id),
      club_name: club.name,
      sent_at: announcement.created_at,
      receiver_user_ids: clubMembers
        .map((m) => String(m.user_id))
        .filter((id) => id !== String(member.user_id)),
    };

    await emitEvent(
      this.notificationClient,
      NOTIFICATION_EVENTS.CLUB_ANNOUNCEMENT,
      notify_data,
    );

    return {
      ...announcement,
      created_at: toFullString(announcement.created_at),
      announcer: {
        id: announcerUser.id,
        login: announcerUser.login,
        first_name: announcerUser.first_name,
        last_name: announcerUser.last_name,
        avatar: announcerUser.avatar ?? null,
        department: announcerUser.department ?? null,
        member_id: member.id,
      },
    };
  }
  // async createAnnouncement({
  //   slug,
  //   user_id,
  //   description,
  // }: {
  //   slug: string;
  //   user_id: number;
  //   description: string;
  // }): Promise<AnnouncementWithAuthor> {
  //   const { club, member } = await this.clubAccessService.requireRole(
  //     slug,
  //     user_id,
  //     MemberRole.LEADER,
  //   );

  //   const announcement = await this.prisma.announcement.create({
  //     data: {
  //       club_id: club.id,
  //       announcer_id: member.id,
  //       description,
  //     },
  //   });

  //   const announcerUser = await rpc<User>(
  //     this.authClient,
  //     AUTH_PATTERNS.GET_USER_BY_ID,
  //     { user_id: member.user_id },
  //   );

  //   return {
  //     ...announcement,
  //     created_at: toFullString(announcement.created_at),
  //     announcer: {
  //       id: announcerUser.id,
  //       login: announcerUser.login,
  //       first_name: announcerUser.first_name,
  //       last_name: announcerUser.last_name,
  //       avatar: announcerUser.avatar ?? null,
  //       department: announcerUser.department ?? null,
  //       member_id: member.id,
  //     },
  //   };
  // }

  async deleteAnnouncement({
    slug,
    user_id,
    announcement_id,
  }: {
    slug: string;
    user_id: number;
    announcement_id: number;
  }): Promise<{ status: number; message: string }> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    const announcement = await this.prisma.announcement.findUnique({
      where: {
        id: announcement_id,
      },
    });

    if (!announcement || announcement.club_id !== club.id) {
      throw rpcError(
        404,
        'Announcement not found or does not belong to the club',
        'Not Found',
      );
    }

    await this.prisma.announcement.delete({
      where: {
        id: announcement_id,
      },
    });

    return {
      status: 200,
      message: 'Announcement deleted successfully',
    };
  }
}
