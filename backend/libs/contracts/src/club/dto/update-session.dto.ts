import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CreateSessionDto } from './create-session.dto.js';

export class UpdateSessionDto extends PartialType(OmitType(CreateSessionDto, ['weekday'] as const)) {
  @IsOptional() @IsBoolean()
  apply_to_future?: boolean;
  @IsOptional() @IsString()
  template_id?: string;
}