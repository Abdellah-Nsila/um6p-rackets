import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// POST /admin/clubs
// The slug is NEVER sent: the service builds it from the name.
export class CreateClubDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  // keep the same max length as your UpdateClubDto
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  // auth-service user id of the first coach
  @Type(() => Number)
  @IsInt()
  @Min(1)
  coach_user_id: number;
}