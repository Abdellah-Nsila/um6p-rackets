// apps/club-service/src/access/club-access.service.ts
import { Injectable } from '@nestjs/common';
import { MemberRole } from '@app/contracts/club/club.types.js';
import { rpcError } from '@app/contracts/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ClubAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getClub(slug: string) {
    const club = await this.prisma.club.findUnique({ where: { slug, deleted_at: null } });
    if (!club) throw rpcError(404, 'Club not found', 'Not Found');
    return club;
  }

  // active member of the club, or null
  findMember(club_id: number, user_id: number) {
    return this.prisma.member.findFirst({
      where: { club_id: club_id, user_id: user_id, left_at: null },
    });

  }

  // 404 if no club, 403 if not a member or the role is too low
  async requireRole(slug: string, user_id: number, minRole: MemberRole) {
    const club = await this.getClub(slug);
    const member = await this.findMember(club.id, user_id);
    if (!member) throw rpcError(403, 'You are not a member of this club', 'Forbidden');
    if (member.role < minRole) {
      throw rpcError(403, 'You do not have permission for this action', 'Forbidden');
    }
    return { club, member };
  }
}