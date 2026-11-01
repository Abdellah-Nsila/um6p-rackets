import { ClubSlugParamDto } from './club-slug-param.dto.js';
import { IsIdParam } from '@app/common';

export class DeleteAnnouncementParamDto  extends ClubSlugParamDto {
  @IsIdParam('announcement')
  announcement_id: number;
}





