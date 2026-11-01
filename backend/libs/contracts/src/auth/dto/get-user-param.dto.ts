import { IsIdParam } from '@app/common';

export class GetUserParamDto {
  @IsIdParam('user')
  user_id: number;
}
