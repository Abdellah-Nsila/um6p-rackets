// add-member.dto.ts
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { MemberRole } from '../club.types.js';

export class AddMemberDto {
  @IsInt() @IsPositive()
  user_id: number;

  @IsOptional() @IsEnum(MemberRole)
  role?: MemberRole;
}