import { CLUB_PATTERNS, CLUB_SERVICE, ClubLeaderboard } from '@app/contracts';
import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { type AuthenticatedUser } from '@app/common';
import { Public } from '../common/decorators/public.decorator.js';
import { rpc } from '../../../../libs/common/src/helpers/rpc.helper.js';
import { Body } from '@nestjs/common';
import {
  ClubSlugParamDto,
  LeaderboardQueryDto,
  JoinRequestParamDto,
  PaginationQueryDto,
  UpdateClubDto,
} from '@app/contracts/club/dto/index.js';

@Controller('clubs')
export class ClubController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}

  @Public()
  @Get()
  async getAllClubs() {
    console.log(
      `[ClubController] Received request for all clubs, and send request to Club Service`,
    );
    return await rpc(this.clubClient, CLUB_PATTERNS.GET_CLUBS, {});
  }

  @Public()
  @Get(':slug')
  async getClub(@Param() { slug }: ClubSlugParamDto) {
    console.log(
      `[ClubController] Received request for club slug: ${slug}, and send request to Club Service`,
    );
    return await rpc(this.clubClient, CLUB_PATTERNS.GET_CLUB, {
      club_slug: slug,
    });
  }

  @Get(':slug/status')
  async getClubStatus(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request for club status for slug: ${slug} and user_id: ${user.id}, and send request to Club Service`,
    );
    return await rpc(this.clubClient, CLUB_PATTERNS.GET_CLUB_STATUS, {
      club_slug: slug,
      user_id: user.id,
    });
  }

  // PATCH /clubs/:slug
  @Patch(':slug')
  async updateClub(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateClubDto,
  ) {
    console.log(
      `[ClubController] Received request to update club for slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.PATCH_CLUB_UPDATE, {
      club_slug: slug,
      user_id: user.id,
      body,
    });
    return response;
  }

  // GET /:slug/leaderboard
  @Get(':slug/leaderboard')
  async getClubLeaderboard(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: LeaderboardQueryDto,
  ) {
    console.log(
      `[ClubController] Received request for club leaderboard for slug: ${slug}, and send request to Club Service`,
    );
    // If no target_user_id is provided, we target the requester_id to get their rank in the leaderboard
    if (!query.target_user_id) {
      query.target_user_id = user.id;
    }
    return await rpc<ClubLeaderboard>(this.clubClient, CLUB_PATTERNS.GET_CLUB_LEADERBOARD, {
      slug,
      page: query.page,
      limit: query.limit,
      target_user_id: query.target_user_id,
    });
  }

  // POST /clubs/:slug/join
  @Post(':slug/join')
  async joinClub(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return rpc(this.clubClient, CLUB_PATTERNS.POST_CLUB_JOIN, {
      club_slug: slug,
      user_id: user.id,
    });
  }

  // DELETE /clubs/:slug/join
  @Delete(':slug/join')
  async cancelJoin(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return rpc(this.clubClient, CLUB_PATTERNS.DELETE_CLUB_JOIN, {
      club_slug: slug,
      user_id: user.id,
    });
  }

  // DELETE /clubs/:slug/leave
  @Delete(':slug/leave')
  async leaveClub(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return rpc(this.clubClient, CLUB_PATTERNS.DELETE_CLUB_LEAVE, {
      club_slug: slug,
      user_id: user.id,
    });
  }

  // GET /clubs/:slug/join-requests
  @Get(':slug/join-requests')
  async getJoinRequests(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { page, limit }: PaginationQueryDto,
  ) {
    return rpc(this.clubClient, CLUB_PATTERNS.GET_CLUB_JOIN_REQUESTS, {
      club_slug: slug,
      user_id: user.id,
      page,
      limit,
    });
  }

  // POST /clubs/:slug/join-requests/:request_id/reject
  @Post(':slug/join-requests/:request_id/reject')
  async rejectJoinRequest(
    @Param() { slug, request_id }: JoinRequestParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return rpc(this.clubClient, CLUB_PATTERNS.POST_CLUB_JOIN_REQUEST_REJECT, {
      club_slug: slug,
      user_id: user.id,
      request_id,
    });
  }
}
