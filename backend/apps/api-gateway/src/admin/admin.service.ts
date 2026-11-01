// -> apps/api-gateway/src/admin/admin.service.ts
import {
  AUTH_PATTERNS,
  AUTH_SERVICE,
  CLUB_PATTERNS,
  CLUB_SERVICE,
  User,
} from '@app/contracts';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { rpc } from '../../../../libs/common/src/helpers/rpc.helper.js';
import {
  AdminListUsersQueryDto,
  AdminUpdateUserDto,
  CreateClubDto,
} from '@app/contracts/admin/dto/index.js';
import { firbiddenSlugs } from '../helpers/forbidden-slugs.js';
import { AdminStats, AuthStats, ClubStats } from '@app/contracts/admin/admin.types.js';

@Injectable()
export class AdminService {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy,
  ) {}

  // ---------- Users ----------

  listUsers(query: AdminListUsersQueryDto) {
    return rpc(this.authClient, AUTH_PATTERNS.ADMIN_LIST_USERS, query);
  }

  updateUser(admin_id: number, user_id: number, body: AdminUpdateUserDto) {
    if (Object.values(body).every((v) => v === undefined)) {
      throw new BadRequestException('At least one field is required');
    }
    if (body.role !== undefined && admin_id === user_id) {
      throw new ForbiddenException('You cannot change your own role');
    }
    return rpc(this.authClient, AUTH_PATTERNS.ADMIN_UPDATE_USER, {
      admin_id: admin_id,
      user_id: user_id,
      body,
    });
  }

  async deleteUser(admin_id: number, user_id: number):Promise<{ status: number; message: string }> {
    if (admin_id === user_id) {
      throw new ForbiddenException('You cannot delete yourself');
    }
    // 1. auth service: soft delete + anonymize + revoke tokens
    await rpc(this.authClient, AUTH_PATTERNS.ADMIN_DELETE_USER, {
      admin_id: admin_id,
      user_id: user_id,
    });
    // 2. club service: close the memberships, cancel pending join requests
    // also takes care remove role for coach and give to oldest leader or member
    // TODO, i will add later update club coach
    await rpc(this.clubClient, CLUB_PATTERNS.WHEN_USER_DELETED, {
      user_id: user_id,
    });

    return { status: 204, message: `User ${user_id} deleted successfully` };
  }

  // ---------- Clubs ----------

  async createClub(body: CreateClubDto) {
    // fail early with a 404 if the coach does not exist.
    // Use your existing "get user" pattern (the one taking { user_id: string }).
    const coach = await rpc<User | null>(this.authClient, AUTH_PATTERNS.GET_USER_BY_ID, {
      user_id: body.coach_user_id,
    });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }
    const slug = body.name.trim().toLowerCase().replace(/\s+/g, '-');

    if (firbiddenSlugs.includes(slug)) {
      throw new BadRequestException('Name is forbidden');
    }
    return rpc(this.clubClient, CLUB_PATTERNS.POST_CLUB_ADMIN_CREATE, { body });
  }

  deleteClub(slug: string) {
    return rpc(this.clubClient, CLUB_PATTERNS.DELETE_CLUB_ADMIN_DELETE, {
      club_slug: slug,
    });
  }

  // ---------- Stats ----------

  async getStats(weeks: number): Promise<AdminStats> {
    const [auth, club] = (await Promise.all([
      rpc(this.authClient, AUTH_PATTERNS.ADMIN_STATS, { weeks }),
      rpc(this.clubClient, CLUB_PATTERNS.GET_CLUB_ADMIN_STATS, { weeks }),
    ])) as [AuthStats, ClubStats];

    const signups = new Map(auth.weekly.map((w) => [w.week_start, w.signups]));
    const clubWeeks = new Map(club.weekly.map((w) => [w.week_start, w]));

    // union of both week lists, oldest first, so no week is ever dropped
    const weekStarts = [
      ...new Set([...signups.keys(), ...clubWeeks.keys()]),
    ].sort();

    return {
      totals: {
        users: auth.users,
        clubs: club.clubs,
        members: club.members,
      },
      members_per_club: club.members_per_club,
      weekly: weekStarts.map((week_start) => ({
        week_start,
        signups: signups.get(week_start) ?? 0,
        matches: clubWeeks.get(week_start)?.matches ?? 0,
        bookings: clubWeeks.get(week_start)?.bookings ?? 0,
      })),
    };
  }
}