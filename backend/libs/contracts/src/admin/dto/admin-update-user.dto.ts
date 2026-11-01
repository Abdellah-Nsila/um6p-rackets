// -> libs/contracts/src/auth/dto/admin-update-user.dto.ts
import { UserRole } from '@app/contracts';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';


const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// PATCH /admin/users/:user_id (at least one field, checked in the service)
// This is the ONLY user DTO that accepts `role`. Never add it to register or update-user.
export class AdminUpdateUserDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  first_name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  last_name?: string;

  // null clears the department (IsOptional lets null through)
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(255)
  department?: string | null;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}