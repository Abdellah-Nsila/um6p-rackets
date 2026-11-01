import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { MatchMineFilter } from '../club.types.js';
import { PaginationQueryDto } from './pagination-query.dto.js';

export const MATCH_STATUS_FILTERS = ['all', 'pending', 'upcoming', 'completed', 'cancelled'] as const;
export type MatchStatusFilter = (typeof MATCH_STATUS_FILTERS)[number];

export class MatchesQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(MATCH_STATUS_FILTERS)
  status: MatchStatusFilter = 'all';

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @IsIn([MatchMineFilter.PLAYER, MatchMineFilter.REFEREE, MatchMineFilter.ANY])
  mine?: MatchMineFilter; // omitted = all matches of the club
}