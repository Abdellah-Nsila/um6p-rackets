import { ClubSlugParamDto } from './index.js';
import { IsIdParam } from '@app/common';

export class UpdateMemberRoleParamDto extends ClubSlugParamDto {
  @IsIdParam('member')
  member_id: number;
}
