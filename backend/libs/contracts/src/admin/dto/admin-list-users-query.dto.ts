import { UserRole } from '@app/contracts';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';


export const ADMIN_USER_SORT_FIELDS = [
  'joined_at',
  'first_name',
  'last_name',
  'login',
] as const;

export type AdminUserSortField = (typeof ADMIN_USER_SORT_FIELDS)[number];

// GET /admin/users?search=&role=&sort=&order=&page=&limit=
export class AdminListUsersQueryDto {
  // partial, case-insensitive: first_name, last_name, login
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  })
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsIn(ADMIN_USER_SORT_FIELDS)
  sort: AdminUserSortField = 'joined_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}