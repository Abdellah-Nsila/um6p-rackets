// club-slug-param.dto.ts
import { IsString, Matches, MaxLength } from 'class-validator';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ClubSlugParamDto {
  @IsString() @MaxLength(255)
  @Matches(SLUG_REGEX, { message: 'invalid club slug' })
  slug: string;
}