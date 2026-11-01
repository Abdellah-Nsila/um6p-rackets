import { IsString, Matches } from 'class-validator';

export class MarkAsReadDto {
  @IsString()
  @Matches(/^[0-9]+$/)
  notification_id!: string;

  @IsString()
  @Matches(/^[0-9]+$/)
  user_id!: string;
}