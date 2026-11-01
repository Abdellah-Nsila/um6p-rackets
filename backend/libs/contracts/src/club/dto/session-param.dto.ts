import { ClubSlugParamDto } from './club-slug-param.dto.js';
import { IsIdParam } from '@app/common';

export class SessionParamDto extends ClubSlugParamDto {
  @IsIdParam('session')
  session_id: Number;
}