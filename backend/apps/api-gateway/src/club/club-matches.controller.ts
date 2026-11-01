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
  GetMatchParamDto,
  MatchesQueryDto,
  MatchRequestDto,
  MatchResultDto,
  PaginationQueryDto,
} from '@app/contracts/club/dto/index.js';

@Controller('clubs/:slug/matches')
export class ClubMatchesController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}

  // POST /clubs/:slug/matches/request
  @Post('request')
  async requestMatch(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: MatchRequestDto,
  ) {
    console.log(
      '[ClubMatchesController] requestMatch called with slug:',
      slug,
      'user:',
      user,
    );
    return this.clubClient.send(CLUB_PATTERNS.POST_CLUB_MATCH_REQUEST, {
      slug,
      user_id: user.id,
      body,
    });
  }

  // GET /clubs/:slug/matches?status=&mine=&page=&limit=
  @Get()
  async getMatches(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: MatchesQueryDto,
  ) {
    return this.clubClient.send(CLUB_PATTERNS.GET_CLUB_MATCHES, {
      slug,
      user_id: user.id,
      query,
    });
  }

  // GET /clubs/:slug/matches/:match_id returns one MatchDetail
  @Get(':match_id')
  async getMatch(
    @Param() { slug, match_id }: GetMatchParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubClient.send(CLUB_PATTERNS.GET_CLUB_MATCH, {
      slug,
      user_id: user.id,
      match_id: match_id,
    });
  }

  // POST /clubs/:slug/matches/:id/accept
  @Post(':match_id/accept')
  async acceptMatch(
    @Param() { slug, match_id }: GetMatchParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubClient.send(CLUB_PATTERNS.POST_CLUB_MATCH_ACCEPT, {
      slug,
      user_id: user.id,
      match_id: match_id,
    });
  }

  // POST /clubs/:slug/matches/:id/cancel
  @Post(':match_id/cancel')
  async cancelMatch(
    @Param() { slug, match_id }: GetMatchParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.clubClient.send(CLUB_PATTERNS.POST_CLUB_MATCH_CANCEL, {
      slug,
      user_id: user.id,
      match_id: match_id,
    });
  }

  // POST /clubs/:slug/matches/:id/result
  @Post(':match_id/result')
  async submitMatchResult(
    @Param() { slug, match_id }: GetMatchParamDto,
    @CurrentUser() user: AuthenticatedUser,
    // results can't be equal
    @Body() body: MatchResultDto,
  ) {
    return this.clubClient.send(CLUB_PATTERNS.POST_CLUB_MATCH_RESULT, {
      slug,
      user_id: user.id,
      match_id: match_id,
      result: body,
    });
  }
}
