// auth/register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsBoolean, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString() @MaxLength(255) login: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
  @IsString() @MaxLength(255) first_name: string;
  @IsString() @MaxLength(255) last_name: string;
  
  @IsOptional() @IsBoolean() gender?: boolean;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() @MaxLength(50) phone_number?: string;
}