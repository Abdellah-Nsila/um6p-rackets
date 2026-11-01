import { CLUB_PATTERNS } from "@app/contracts";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { MembersService } from "./members.service.js";
import { Controller } from "@nestjs/common";
import { AddMemberDto } from "@app/contracts/club/dto/index.js";

@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_MEMBERS)
  async getClubMembers(data: { club_slug: string; user_id: number, limit?: number, page?: number, login?: string, role?: number }) {
    return this.membersService.getClubMembers(data.club_slug, data.user_id, data.limit, data.page, data.login, data.role);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_MEMBER_ADD)
  async addClubMember(data: { club_slug: string; user_id: number, body: AddMemberDto }) {
    return this.membersService.addClubMember(data.club_slug, data.user_id, data.body);
  }

  @MessagePattern(CLUB_PATTERNS.PATCH_CLUB_MEMBER_ROLE_UPDATE)
  async updateClubMemberRole(data: { club_slug: string; user_id: number, body: { role: 0 | 1 }, member_id: number }) {
    return this.membersService.updateClubMemberRole(data.club_slug, data.user_id, data.body, data.member_id);
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_MEMBER_REMOVE)
  async removeClubMember(data: { club_slug: string; user_id: number, member_id: number }) {
    return this.membersService.removeClubMember(data.club_slug, data.user_id, data.member_id);
  }

  @MessagePattern(CLUB_PATTERNS.WHEN_USER_DELETED)
  async whenUserDeleted(@Payload() data: { user_id: number }) {
    return await this.membersService.whenUserDeleted(data.user_id);
  }
}