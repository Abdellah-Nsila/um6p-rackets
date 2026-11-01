import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateClubDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255) @MinLength(4)
  name?: string;

  @IsOptional() @IsString() @MaxLength(2000) @MinLength(10)
  description?: string;

}