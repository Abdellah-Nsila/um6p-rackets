import { CLUB_PATTERNS, CLUB_SERVICE } from '@app/contracts';
import {
  BadRequestException,
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
import { addDays, mondayOf, today, type AuthenticatedUser } from '@app/common';
import { Body } from '@nestjs/common';
import {
  ClubSlugParamDto,
  SessionParamDto,
  WeekQueryDto,
  CreateSessionDto,
  UpdateSessionDto,
  DeleteSessionQueryDto,
} from '@app/contracts/club/dto/index.js';

@Controller('clubs/:slug/sessions')
export class ClubSessionsController {
  constructor(@Inject(CLUB_SERVICE) private readonly clubClient: ClientProxy) {}

  // sessions
  @Get()
  async getClubWeekSessions(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { week }: WeekQueryDto,
  ) {
    console.log(
      `[ClubController] Received request for club week sessions for slug: ${slug} and user_id: ${user.id}, and send request to Club Service, week: ${week}`,
    );
    // if week is not provided, set it to current week monday
    if (!week) {
      week = mondayOf(today());
    }
    //  check if week is valid date
    else if (isNaN(Date.parse(week))) {
      throw new BadRequestException('Invalid week date');
    }

    // check that the week day is not in far future more than current week + 1 week
    const maxDay = addDays(mondayOf(today()), 2 * 7); // current week + 1 week

    if (week >= maxDay) {
      throw new BadRequestException(
        `Week date cannot be in the future more than current week + 1 week, max allowed: ${maxDay}`,
      );
    }

    // check that the week day is not in far past more than 1 year
    const minDay = addDays(mondayOf(today()), -365); // current week - 1 year

    if (week < minDay) {
      throw new BadRequestException(
        `Week date cannot be in the past more than 1 year, min allowed: ${minDay}`,
      );
    }

    const response = this.clubClient.send(
      CLUB_PATTERNS.GET_CLUB_WEEK_SESSIONS,
      { club_slug: slug, user_id: user.id, week_start_date: week },
    );
    return response;
  }

  @Post(':session_id/attend')
  async attendSession(
    @Param() { slug, session_id }: SessionParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request to attend session with id: ${session_id} for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.POST_CLUB_SESSION_ATTEND,
      { club_slug: slug, user_id: user.id, session_id: session_id },
    );
    return response;
  }

  @Delete(':session_id/attend')
  async unattendSession(
    @Param() { slug, session_id }: SessionParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log(
      `[ClubController] Received request to unattend session with id: ${session_id} for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.DELETE_CLUB_SESSION_ATTEND,
      { club_slug: slug, user_id: user.id, session_id: session_id },
    );
    return response;
  }

  @Post()
  async createSession(
    @Param() { slug }: ClubSlugParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateSessionDto,
  ) {
    console.log(
      `[ClubController] Received request to create session for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.POST_CLUB_SESSION_CREATE,
      { club_slug: slug, user_id: user.id, body: body },
    );
    return response;
  }

  @Patch(':session_id')
  async updateSession(
    @Param() { slug, session_id }: SessionParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateSessionDto,
  ) {
    console.log(
      `[ClubController] Received request to update session with id: ${session_id} for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service with body: ${JSON.stringify(body)}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.PATCH_CLUB_SESSION_UPDATE,
      { club_slug: slug, user_id: user.id, session_id: session_id, body: body },
    );
    return response;
  }

  @Delete(':session_id')
  async deleteSession(
    @Param() { slug, session_id }: SessionParamDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query() { apply_to_future }: DeleteSessionQueryDto,
  ) {
    console.log(
      `[ClubController] Received request to delete session with id: ${session_id} for club slug: ${slug} and user_id: ${user.id}, and send request to Club Service with apply_to_future: ${apply_to_future}`,
    );
    const response = this.clubClient.send(
      CLUB_PATTERNS.DELETE_CLUB_SESSION_DELETE,
      {
        club_slug: slug,
        user_id: user.id,
        session_id: session_id,
        apply_to_future: apply_to_future ?? false,
      },
    );
    return response;
  }
}
