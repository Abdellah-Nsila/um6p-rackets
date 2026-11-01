import { IsString, Matches } from 'class-validator';

export class MarkAllAsReadDto {
  @IsString()
  @Matches(/^[0-9]+$/)
  user_id!: string;

  // we dont need an update the prisma should do that 
}