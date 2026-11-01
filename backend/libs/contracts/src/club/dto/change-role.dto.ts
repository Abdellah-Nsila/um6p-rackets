// change-role.dto.ts
import { IsIn } from 'class-validator';
import { MemberRole } from '../club.types.js';

export class ChangeRoleDto {
  @IsIn([MemberRole.MEMBER, MemberRole.LEADER])
  role: MemberRole.MEMBER | MemberRole.LEADER;
}