import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

import {
  NotificationCategory,
  NotificationType,
  SenderType,
} from '../notification.types.js';
import { Type } from 'class-transformer';

export class NotificationEventDto {
  @IsString()
  @IsNotEmpty()
  event_id!: string;

  @IsEnum(SenderType)
  sender_type!: SenderType;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  sender_id?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sender_name?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  sender_avatar_url?: string | null;

  @IsEnum(NotificationCategory)
  category!: NotificationCategory;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  club_id?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  club_name?: string;

  @IsOptional()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate({ message: 'The date must be a valid ISO 8601 date string.' })
  sent_at?: Date;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  receiver_user_ids!: string[];
}
