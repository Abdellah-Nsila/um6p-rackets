import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  Achievement,
  Club,
  ClubMemberStatus,
  ClubWithMembersCountAndCoachFullName,
  JoinedClub,
  UserProfileData,
} from '@app/contracts/club/club.types.js';
import { ClubServiceService } from './club-service.service.js';
import { CLUB_PATTERNS, ClubLeaderboard, Paginated, UserHistoryMatch } from '@app/contracts';
import { UpdateClubDto } from '@app/contracts/club/dto/index.js';
import { CreateClubDto } from '@app/contracts/admin/dto/index.js';
import { LeaderboardService } from './leaderboard/leaderboard.service.js';
import { AchievementsService } from './achievements/achievements.service.js';
import { MembersService } from './members/members.service.js';
import { ClubStats } from '@app/contracts/admin/admin.types.js';

@Controller()
export class ClubServiceController {
  constructor(
    private readonly clubServiceService: ClubServiceService,
    private readonly membersService: MembersService,
    private readonly leaderboardService: LeaderboardService,
    private readonly achievementsService: AchievementsService,
  ) {}

  @MessagePattern(CLUB_PATTERNS.GET_USER_PROFILE)
  getMemberProfile(data: { user_id: number }): Promise<UserProfileData> {
    console.log(
      `[ClubService] Received request for member profile for user_id: ${data.user_id}`,
    );
    return this.membersService.getUserProfile(data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.GET_USER_MEMBERSHIPS)
  getUserMemberships(data: { user_id: number }): Promise<JoinedClub[]> {
    console.log(
      `[ClubService] Received request for user memberships for user_id: ${data.user_id}`,
    );
    return this.membersService.getUserJoinedClubs(data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.GET_USER_ACHIEVEMENTS)
  getUserAchievements(data: { user_id: number }): Promise<Achievement[]> {
    console.log(
      `[ClubService] Received request for user achievements for user_id: ${data.user_id}`,
    );
    return this.achievementsService.getUserAchievements(data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.GET_USER_MATCHES)
  async getUserMatches(
    @Payload() payload: { user_id: number; page: number; limit: number },
  ): Promise<Paginated<UserHistoryMatch>> {
    return this.membersService.getUserClubsMatchesHistory(
      payload.user_id,
      payload.page,
      payload.limit,
      false, // fetchAll set to FALSE for paginated results
    );
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUBS)
  getAllClubs(): Promise<Club[]> {
    console.log(`[ClubService] Received request for all clubs`);
    return this.clubServiceService.getAllClubs();
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB)
  async getClubWithMembersCountAndCoachFullName(data: {
    club_slug: string;
  }): Promise<ClubWithMembersCountAndCoachFullName> {
    console.log(
      `[ClubService] Received request for club slug: ${data.club_slug}`,
    );
    return this.clubServiceService.getClubWithMembersCountAndCoachFullName(
      data.club_slug,
    );
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_STATUS)
  async getClubStatus(data: {
    club_slug: string;
    user_id: number;
  }): Promise<ClubMemberStatus> {
    console.log(
      `[ClubService] Received request for club status for slug: ${data.club_slug} and user_id: ${data.user_id}`,
    );
    return this.clubServiceService.getClubStatus(data.club_slug, data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.PATCH_CLUB_UPDATE)
  async updateClub(data: {
    club_slug: string;
    user_id: number;
    body: UpdateClubDto;
  }): Promise<Club> {
    return this.clubServiceService.updateClub(
      data.club_slug,
      data.user_id,
      data.body,
    );
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_LEADERBOARD)
  async getClubLeaderboard(
    @Payload()
    payload: {
      slug: string;
      page: number;
      limit: number;
      target_user_id: number;
    },
  ) : Promise<ClubLeaderboard>{
    return this.leaderboardService.getClubLeaderboard(
      payload.slug,
      payload.page,
      payload.limit,
      payload.target_user_id,
    );
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_JOIN)
  joinClub(
    @Payload() { club_slug, user_id }: { club_slug: string; user_id: number },
  ) {
    return this.clubServiceService.joinClub(club_slug, user_id);
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_JOIN)
  cancelJoin(
    @Payload() { club_slug, user_id }: { club_slug: string; user_id: number },
  ) {
    return this.clubServiceService.cancelJoin(club_slug, user_id);
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_JOIN_REQUESTS)
  getJoinRequests(
    @Payload()
    {
      club_slug,
      user_id,
      page,
      limit,
    }: {
      club_slug: string;
      user_id: number;
      page: number;
      limit: number;
    },
  ) {
    return this.clubServiceService.getJoinRequests(
      club_slug,
      user_id,
      page,
      limit,
    );
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_JOIN_REQUEST_REJECT)
  rejectJoinRequest(
    @Payload()
    {
      club_slug,
      user_id,
      request_id,
    }: {
      club_slug: string;
      user_id: number;
      request_id: number;
    },
  ) {
    return this.clubServiceService.rejectJoinRequest(
      club_slug,
      user_id,
      request_id,
    );
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_LEAVE)
  async leaveClub(data: { club_slug: string; user_id: number }) {
    return this.clubServiceService.leaveClub(data.club_slug, data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_ADMIN_CREATE)
  createClub(data: { body: CreateClubDto }) {
    return this.clubServiceService.createClub(data.body);
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_ADMIN_DELETE)
  deleteClub(data: { club_slug: string }) {
    return this.clubServiceService.deleteClub(data.club_slug);
  }

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_ADMIN_STATS)
  async getClubStats(data: { weeks: number }): Promise<ClubStats> {
    return this.clubServiceService.getClubStats(data.weeks);
  }
}
