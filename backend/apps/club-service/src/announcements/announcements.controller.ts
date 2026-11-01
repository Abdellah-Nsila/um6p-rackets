import { Controller } from "@nestjs/common";
import { AnnouncementsService } from "./announcements.service.js";
import { MessagePattern } from "@nestjs/microservices";
import { CLUB_PATTERNS } from "@app/contracts/patterns.js";


@Controller()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}
  @MessagePattern(CLUB_PATTERNS.GET_CLUB_ANNOUNCEMENTS)
  async getClubAnnouncements(data: { slug: string; user_id: number ; page: number; limit: number }) {
    const { slug, user_id, page, limit } = data;
    const response = await this.announcementsService.getClubAnnouncements({
      slug,
      user_id,
      page,
      limit,
    });
    return response;
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_ANNOUNCEMENT_CREATE)
  async createAnnouncement(data: { slug: string; user_id: number; description: string }) {
    const { slug, user_id, description } = data;
    const response = await this.announcementsService.createAnnouncement({
      slug,
      user_id,
      description,
    });
    return response;
  }

  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_ANNOUNCEMENT_DELETE)
  async deleteAnnouncement(data: { slug: string; user_id: number; announcement_id: number }) {
    const { slug, user_id, announcement_id } = data;
    const response = await this.announcementsService.deleteAnnouncement({
      slug,
      user_id,
      announcement_id,
    });
    return response;
  }
}