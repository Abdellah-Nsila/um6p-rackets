import { Injectable } from '@nestjs/common';

import { AdminListUsersQueryDto, AdminUpdateUserDto } from '@app/contracts/admin/dto/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { rpcError } from '@app/contracts';
import { AuthStats } from '@app/contracts/admin/admin.types.js';
  import { addDays, dayOf, mondayOf, today, toDate } from '@app/common/dates.js';


// The ONLY user fields an admin can read. password_hash, tokens, reset fields,
// phone_number and deleted_at are never selected.
const ADMIN_USER_SELECT = {
  id: true,
  login: true,
  first_name: true,
  last_name: true,
  email: true,
  department: true,
  avatar: true,
  role: true,
  joined_at: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) { }

  // GET /admin/users
  async listUsers(query: AdminListUsersQueryDto) {
    const { search, role, sort, order, page, limit } = query;
    const mode = 'insensitive' as const;

    const terms = search ? search.split(/\s+/).filter(Boolean) : [];

    const where = {
      deleted_at: null,
      ...(role ? { role } : {}),
      AND: terms.map((term) => ({
        OR: [
          { first_name: { contains: term, mode } },
          { last_name: { contains: term, mode } },
          { login: { contains: term, mode } },
        ],
      })),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: ADMIN_USER_SELECT,
        // id as a tie-breaker keeps the pages stable when many rows share a value
        orderBy: [{ [sort]: order }, { id: order }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, page, limit, total };
  }

  // PATCH /admin/users/:user_id
  async updateUser(admin_id: number, user_id: number, body: AdminUpdateUserDto) {
    // we already checked:
    // admin != user_id
    // the body is not empty
    // it contains at least one field to update

    // use update many to update user
    const updatedUser = await this.prisma.user.updateMany({
      where: { id: user_id, deleted_at: null },
      data: body,
    });

    if (updatedUser.count === 0) {
      throw rpcError(404, 'User not found', "Not Found");
    }

    return updatedUser;
  }

  // DELETE /admin/users/:user_id
  async deleteUser(admin_id: number, user_id: number) {

    // soft delete + anonymize + revoke tokens
    const deletedUser = await this.prisma.user.updateMany({
      where: { id: user_id, deleted_at: null },
      data: {
        deleted_at: new Date(),
        login: `ghost_user_${user_id}`,
        first_name: 'Deleted',
        last_name: 'User',
        email: `deleted_${user_id}@internal.system`,
        department: null,
        avatar: null,
        role: 'USER',
      }
    });

    if (deletedUser.count === 0) {
      throw rpcError(404, 'User not found', "Not Found");
    }

    // delete all tokens for this user (logout everywhere)
    // TODO: ask nsila if that correct
    await this.prisma.refreshToken.deleteMany({
      where: { user_id },
    });
    console.log(`[AuthService] Deleted user ${user_id} and revoked all tokens by admin ${admin_id}`);

    return deletedUser;
  }



async getStats(weeks: number): Promise<AuthStats> {
  const firstWeek = addDays(mondayOf(today()), -7 * (weeks - 1));

  const [total_users, rows] = await Promise.all([
    this.prisma.user.count({ where: { deleted_at: null } }),
    this.prisma.user.findMany({
      where: { deleted_at: null, joined_at: { gte: toDate(firstWeek) } },
      select: { joined_at: true },
    }),
  ]);

  // every week starts at 0, so empty weeks still appear
  const buckets = new Map<string, number>();
  for (let i = 0; i < weeks; i++) buckets.set(addDays(firstWeek, 7 * i), 0);

  for (const { joined_at } of rows) {
    const key = mondayOf(dayOf(joined_at));
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    users: total_users,
    weekly: [...buckets].map(([week_start, signups]) => ({ week_start, signups })),
  };
}
}