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
  CreateAchievementDto,
  DeleteAchievementParamDto,
} from '@app/contracts/club/dto/index.js';

@Controller('clubs/:slug/achievements')
export class ClubAchievementController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}


  // GET /clubs/:slug/achievements?page=&limit=
  @Get()
  async getClubAchievements(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { page, limit }: PaginationQueryDto,
  ) {
    console.log(
      `[ClubController] Received request to get club achievements for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with page: ${page} and limit: ${limit}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.GET_CLUB_ACHIEVEMENTS, {
      slug: slug,
      user_id: user.id,
      page,
      limit,
    });
    return response;
  }

  // POST /clubs/:slug/achievements
  @Post()
  async createClubAchievement(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateAchievementDto,
  ) {
    console.log(
      `[ClubController] Received request to create club achievement for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.POST_CLUB_ACHIEVEMENT_CREATE, {
      slug: slug,
      user_id: user.id,
      body: body,
    });
    return response;
  }

  // DELETE /clubs/:slug/achievements/:achievement_id
  @Delete(':achievement_id')
  async deleteClubAchievement(
    @Param() { slug, achievement_id }: DeleteAchievementParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request to delete club achievement for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with achievement_id: ${achievement_id}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.DELETE_CLUB_ACHIEVEMENT_DELETE, {
      slug: slug,
      user_id: user.id,
      achievement_id: achievement_id,
    });
    return response;
  }
}