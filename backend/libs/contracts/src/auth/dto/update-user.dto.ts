import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {

    @IsString()
    @IsOptional()
    @MaxLength(255)
    login?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    first_name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    last_name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    department?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    phone_number?: string;

    @IsBoolean()
    @IsOptional()
    gender?: boolean;

    @IsString()
    @IsOptional()
    avatar?: string;
}