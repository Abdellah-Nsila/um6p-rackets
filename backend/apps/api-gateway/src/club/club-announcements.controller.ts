import { CLUB_PATTERNS, CLUB_SERVICE } from '@app/contracts';
import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { type AuthenticatedUser } from '@app/common';
import { Body } from '@nestjs/common';
import {
  ClubSlugParamDto,
  PaginationQueryDto,
  DeleteAnnouncementParamDto,
  CreateAnnouncementDto,
} from '@app/contracts/club/dto/index.js';


@Controller('clubs/:slug/announcements')
export class ClubAnnouncementsController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}

  // GET /clubs/:slug/announcements?page=&limit=: members only, newest first, returns Paginated<AnnouncementWithAuthor>.
  @Get()
  async getClubAnnouncements(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { page, limit }: PaginationQueryDto,
  ) {
    console.log(
      `[ClubController] Received request to get club announcements for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with page: ${page} and limit: ${limit}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.GET_CLUB_ANNOUNCEMENTS,
      {
        slug: slug,
        user_id: user.id,
        page,
        limit,
      },
    );
    return response;
  }

  // POST /clubs/:slug/announcements
  @Post()
  async createClubAnnouncement(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAnnouncementDto,
  ) {
    console.log(
      `[ClubController] Received request to create club announcement for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.POST_CLUB_ANNOUNCEMENT_CREATE,
      {
        slug: slug,
        user_id: user.id,
        description: body.description,
      },
    );
    return response;
  }

  // DELETE /clubs/:slug/announcements/:announcement_id
  @Delete(':announcement_id')
  async deleteClubAnnouncement(
    @Param() { slug, announcement_id }: DeleteAnnouncementParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request to delete club announcement for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with announcement_id: ${announcement_id}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.DELETE_CLUB_ANNOUNCEMENT_DELETE,
      {
        slug: slug,
        user_id: user.id,
        announcement_id: announcement_id,
      },
    );
    return response;
  }
}
