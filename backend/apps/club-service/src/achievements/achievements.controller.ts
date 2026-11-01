import { Controller } from '@nestjs/common';
import { AchievementsService } from './achievements.service.js';
import { MessagePattern } from '@nestjs/microservices';
import { CLUB_PATTERNS } from '@app/contracts/patterns.js';
import { CreateAchievementDto, PaginationQueryDto } from '@app/contracts/club/dto/index.js';

@Controller()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @MessagePattern(CLUB_PATTERNS.GET_CLUB_ACHIEVEMENTS)
  async getClubAchievements(data: { slug: string; user_id: number} & PaginationQueryDto ) {
    return this.achievementsService.getClubAchievements(data.slug, data.user_id, data.page, data.limit);
  }

  @MessagePattern(CLUB_PATTERNS.POST_CLUB_ACHIEVEMENT_CREATE)
  async createAchievement(data: { slug: string; user_id: number; body: CreateAchievementDto }) {
    return this.achievementsService.createAchievement(data.slug, data.user_id, data.body);
  }
  
  @MessagePattern(CLUB_PATTERNS.DELETE_CLUB_ACHIEVEMENT_DELETE)
  async deleteAchievement(data: { slug: string; user_id: number; achievement_id: number }) {
    return this.achievementsService.deleteAchievement(data.slug, data.user_id, data.achievement_id);
  }
}
