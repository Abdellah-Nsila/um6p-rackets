import {
  Achievement,
  AUTH_PATTERNS,
  AUTH_SERVICE,
  CLUB_PATTERNS,
  CLUB_SERVICE,
  GetUserParamDto,
  JoinedClub,
  Paginated,
  UpdateUserDto,
  User,
  UserClubRank,
  UserHistoryMatch,
  UserProfile,
  UserProfileData,
} from '@app/contracts';
import {
    Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserService } from './user.service.js';
import { Throttle } from '@nestjs/throttler';
import { REQUEST_LIMIT, REQUEST_TTL } from '@app/common/auth/auth.constants.js';
import { type AuthenticatedUser } from '@app/common/auth/authenticated-user.js';
import { rpc } from '@app/common/helpers/rpc.helper.js';

@Controller('users')
export class UserController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy,
    private readonly userService: UserService,
  ) {}

  @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
  @HttpCode(200)
  @Get('me/profile')
  async getCurrentUserProfile(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
  ): Promise<UserProfile> {
    console.log(
      '[UserController] Received request for current user profile: ',
      authenticatedUser.id,
    );
    // Get Raw User First
    const user = await rpc<User>(
      this.authClient,
      AUTH_PATTERNS.GET_USER_BY_ID,
      { user_id: authenticatedUser.id },
    );
    if (!user) {
      throw new NotFoundException(
        `User with ID ${authenticatedUser.id} not found`,
      );
    }
    // Get User Profile Data from Club Service [if he's a member]
    const memberProfile = await rpc<UserProfileData>(
      this.clubClient,
      CLUB_PATTERNS.GET_USER_PROFILE,
      { user_id: authenticatedUser.id },
    );
    return {
      user,
      memberProfile,
    };
  }

  @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
  @HttpCode(200)
  @Get(':user_id/profile')
  async getUserProfile(
    @Param() { user_id }: GetUserParamDto,
    // return type
  ): Promise<UserProfile> {
    console.log(
      '[UserController] Received request for user profile by id: ',
      user_id,
    );
    // Get Raw User First
    const user = await rpc<User>(
      this.authClient,
      AUTH_PATTERNS.GET_USER_BY_ID,
      { user_id },
    );
    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }
    // Get User Profile Data from Club Service [if he's a member]
    const memberProfile = await rpc<UserProfileData>(
      this.clubClient,
      CLUB_PATTERNS.GET_USER_PROFILE,
      { user_id },
    );
    return {
      user,
      memberProfile,
    };
  }

  @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<{ user: User }> {
    // Enforce ownership: The user can only update their own ID
    const payload = { user_id: user.id, profileData: { ...dto } };

    const updatedUser = await rpc<User>(
      this.authClient,
      AUTH_PATTERNS.UPDATE_USER,
      payload,
    );
    return { user: updatedUser };
  }

  // /users/:userId/memberships
  @Get(':user_id/memberships')
  async getUserMemberships(
    @Param() { user_id }: GetUserParamDto,
  ): Promise<JoinedClub[]> {
    return rpc<JoinedClub[]>(
      this.clubClient,
      CLUB_PATTERNS.GET_USER_MEMBERSHIPS,
      {
        user_id: user_id,
      },
    );
  }

  // /users/:userId/achievements
  @Get(':user_id/achievements')
  async getUserAchievements(
    @Param() { user_id }: GetUserParamDto,
  ): Promise<Achievement[]> {
    return rpc<Achievement[]>(
      this.clubClient,
      CLUB_PATTERNS.GET_USER_ACHIEVEMENTS,
      {
        user_id: user_id,
      },
    );
  }

  @Get(':user_id/matches')
  async getUserMatches(
    @Param() { user_id }: GetUserParamDto,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return rpc<Paginated<UserHistoryMatch>>(
      this.clubClient,
      CLUB_PATTERNS.GET_USER_MATCHES,
      {
        user_id: user_id,
        page,
        limit,
      },
    );
  }
}
