import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class OAuthLoginDto {
  @IsIn(['google']) provider: 'google';
  @IsString() @MaxLength(255) subject: string;
  @IsEmail() email: string;
  @IsBoolean() email_verified: boolean;
  @IsString() @MaxLength(255) first_name: string;
  @IsString() @MaxLength(255) last_name: string;
  @IsOptional() @IsString() picture: string | null;
}
