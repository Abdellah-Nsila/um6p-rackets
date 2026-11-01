// history-query.dto.ts
import { IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto.js';
import { SLUG_REGEX } from './club-slug-param.dto.js';

export class HistoryQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() @Matches(SLUG_REGEX)
  club_slug?: string;
}