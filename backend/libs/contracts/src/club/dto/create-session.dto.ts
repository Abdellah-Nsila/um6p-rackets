import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { CreateSessionBody, WeekDay } from '../club.types.js';

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // "17:30"

export class CreateSessionDto implements CreateSessionBody {
  @IsEnum(WeekDay)
  weekday: WeekDay;

  @Matches(TIME_REGEX, { message: 'start_time must be HH:mm' })
  start_time: string;

  @Matches(TIME_REGEX, { message: 'end_time must be HH:mm' })
  end_time: string;

  @IsOptional() @IsString() @MaxLength(100)
  title?: string | null;

  @IsOptional() @IsString() @MaxLength(100)
  location?: string | null;

  @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  capacity: number;

  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'week_start must be YYYY-MM-DD' })
  week_start?: string; // optional, "YYYY-MM-DD", the Monday of the week to create the session for. If not provided, defaults to the current week.

  @IsOptional() @Type(() => Boolean)
  repeat_weekly?: boolean; // false (default) = this week only, true = also next weeks
}