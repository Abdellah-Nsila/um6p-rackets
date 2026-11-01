import { IsOptional, Matches } from 'class-validator';

export class WeekQueryDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'week must be YYYY-MM-DD' })
  week?: string;
}