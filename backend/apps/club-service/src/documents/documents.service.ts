import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClientProxy } from '@nestjs/microservices';
import { AUTH_PATTERNS, AUTH_SERVICE, rpcError, User } from '@app/contracts';
import { ClubAccessService } from '../access/club-access.service.js';
import {
  ClubDocument,
  MemberRole,
  Paginated,
} from '@app/contracts/club/club.types.js';
import { rpc, toFullString } from '@app/common';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    private readonly clubAccessService: ClubAccessService,
  ) {}

  async createDocument(
    slug: string,
    user_id: number,
    path: string,
    title: string,
    description?: string,
  ): Promise<ClubDocument> {
    const { club, member } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    const document = await this.prisma.clubDocument.create({
      data: {
        club_id: club.id,
        title,
        description,
        path,
      },
    });

    return document;
  }

  async deleteDocument(
    slug: string,
    user_id: number,
    document_id: number,
  ): Promise<{state: number, message: string}> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.LEADER,
    );

    const document = await this.prisma.clubDocument.findUnique({
      where: {
        id: document_id,
      },
    });

    if (!document) {
      throw rpcError(404, 'Document not found', "Not Found");
    }

    if (document.club_id !== club.id) {
      throw rpcError(403, 'Document does not belong to this club', "Forbidden");
    }

    await this.prisma.clubDocument.delete({
      where: {
        id: document_id,
      },
    });

    return {state: 200, message: "Document deleted successfully"};
  }

  async getClubDocuments(
    slug: string,
    user_id: number,
    page: number,
    limit: number,
  ): Promise<Paginated<ClubDocument>> {
    const { club } = await this.clubAccessService.requireRole(
      slug,
      user_id,
      MemberRole.MEMBER,
    );

    const total = await this.prisma.clubDocument.count({
      where: {
        club_id: club.id,
      },
    });

    const documents = await this.prisma.clubDocument.findMany({
      where: {
        club_id: club.id,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        id: 'desc',
      },
    });

    return {
      data: documents,
      total,
      page,
      limit,
    };
  }

}
