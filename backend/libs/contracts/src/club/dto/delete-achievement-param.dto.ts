import { ClubSlugParamDto } from './club-slug-param.dto.js';
import { IsIdParam } from '@app/common';

export class DeleteAchievementParamDto extends ClubSlugParamDto {
  @IsIdParam('achievement')
  achievement_id: number;
}
