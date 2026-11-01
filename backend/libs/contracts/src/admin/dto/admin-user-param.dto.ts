import { IsIdParam } from '@app/common';

export class AdminUserParamDto {
  @IsIdParam('user')
  user_id: number;
}