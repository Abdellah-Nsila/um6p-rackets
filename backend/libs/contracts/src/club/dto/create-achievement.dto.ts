// create-achievement.dto.ts
import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { AchievementCode } from '../index.js';

export class CreateAchievementDto {
  @IsInt() @IsPositive()
  user_id: number;

  @IsEnum(AchievementCode)
  code: AchievementCode;
}