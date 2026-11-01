import {
  ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDateString,
  IsEnum, IsInt, IsOptional, IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { MatchMode, MatchRequestBody } from '../club.types.js';
import { Transform } from 'class-transformer';

export class MatchRequestDto implements MatchRequestBody {
  @IsEnum(MatchMode)
  mode: MatchMode;

  @IsOptional() @IsInt() @IsPositive()
  partner_id?: number;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @ArrayUnique()
  @IsInt({ each: true }) @IsPositive({ each: true })
  opponent_ids: number[];

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString() @MaxLength(100)
  location?: string;

  @IsDateString()
  scheduled_at: string;
}