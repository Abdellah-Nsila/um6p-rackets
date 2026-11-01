import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CLUB_PATTERNS } from '@app/contracts';
import { SessionsService } from './sessions.service.js';
import { CreateSessionBody, UpdateSessionBody } from '@app/contracts/club/club.types.js'

@Controller()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}
  @MessagePattern(CLUB_PATTERNS.GET_CLUB_WEEK_SESSIONS)
  async getClubWeekSessions(data: { club_slug: string; week_start_date: string, user_id: number }) {
    console.log(
      `[SessionsController] Received request for club slug: ${data.club_slug} and week start date: ${data.week_start_date}`,
    );
    return this.sessionsService.getClubWeekSessions(data.club_slug, data.week_start_date, data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_SESSION_ATTEND)
  async attendSession(data: { club_slug: string; session_id: string; user_id: number }) {
    console.log(
      `[SessionsController] Received request to attend session with id: ${data.session_id} for club slug: ${data.club_slug} and user_id: ${data.user_id}`,
    );
    return this.sessionsService.attendSession(data.club_slug, data.session_id, data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_SESSION_ATTEND)
  async unattendSession(data: { club_slug: string; session_id: string; user_id: number }) {
    console.log(
      `[SessionsController] Received request to unattend session with id: ${data.session_id} for club slug: ${data.club_slug} and user_id: ${data.user_id}`,
    );
    return this.sessionsService.unattendSession(data.club_slug, data.session_id, data.user_id);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_SESSION_CREATE)
  async createSession(data: { club_slug: string; user_id: number; body: CreateSessionBody }) {
    return this.sessionsService.createSession(data.club_slug, data.user_id, data.body);
  }

  @MessagePattern(CLUB_PATTERNS.PATCH_CLUB_SESSION_UPDATE)
  async updateSession(data: { club_slug: string; session_id: string; user_id: number; body: UpdateSessionBody }) {
    return this.sessionsService.updateSession(data.club_slug, data.session_id, data.user_id, data.body);
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_SESSION_DELETE)
  async deleteSession(data: {
    club_slug: string;
    session_id: string;
    user_id: number;
    apply_to_future: boolean;
  }) {
    return this.sessionsService.deleteSession(
      data.club_slug,
      data.session_id,
      data.user_id,
      data.apply_to_future,
    );
  }
}
