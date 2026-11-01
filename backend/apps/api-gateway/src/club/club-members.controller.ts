import { CLUB_PATTERNS, CLUB_SERVICE } from '@app/contracts';
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
import { Body } from '@nestjs/common';
import {
  ClubSlugParamDto,
  UpdateMemberRoleParamDto,
  UpdateMemberRoleParamDto as RemoveMemberParamDto,
  AddMemberDto,
  MembersQueryDto,
} from '@app/contracts/club/dto/index.js';

@Controller('clubs/:slug/members')
export class ClubMembersController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}

  // GET /clubs/:slug/members?page=&limit=&role=&search=
  @Get()
  async getClubMembers(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { page, limit, role, login }: MembersQueryDto,
  ) {
    console.log(
      `[ClubController] Received request to get members for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service with query parameters: ${JSON.stringify({ page, limit, role, login })}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.GET_CLUB_MEMBERS, {
      club_slug: slug,
      user_id: user.id,
      page,
      limit,
      role,
      login,
    });
    return response;
  }

  // POST /clubs/:slug/members
  @Post()
  async addClubMember(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddMemberDto,
  ) {
    console.log(
      `[ClubController] Received request to add member for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(CLUB_PATTERNS.POST_CLUB_MEMBER_ADD, {
      club_slug: slug,
      user_id: user.id,
      body,
    });
    return response;
  }

  // PATCH /clubs/:slug/members/:member_id/role
  @Patch(':member_id/role')
  async updateClubMemberRole(
    @Param() { slug, member_id }: UpdateMemberRoleParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { role: 0 | 1 },
  ) {
    console.log(
      `[ClubController] Received request to update member role for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.PATCH_CLUB_MEMBER_ROLE_UPDATE,
      {
        club_slug: slug,
        user_id: user.id,
        body,
        member_id: member_id,
      },
    );
    return response;
  }

  // DELETE /clubs/:slug/members/:member_id It sets left_at, so history stays.
  @Delete(':member_id')
  async removeClubMember(
    @Param() { slug, member_id }: RemoveMemberParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request to remove member for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.DELETE_CLUB_MEMBER_REMOVE,
      {
        club_slug: slug,
        user_id: user.id,
        member_id: member_id,
      },
    );
    return response;
  }
}
