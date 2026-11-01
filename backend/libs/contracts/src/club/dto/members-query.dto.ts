import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MemberRole } from '../club.types.js';
import { PaginationQueryDto } from './pagination-query.dto.js';

export class MembersQueryDto extends PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsEnum(MemberRole)
  role?: MemberRole;

  @IsOptional() @IsString() @MaxLength(100)
  login?: string;
}