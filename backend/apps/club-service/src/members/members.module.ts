import { Module } from '@nestjs/common';
import { MembersController } from './members.controller.js';
import { MembersService } from './members.service.js';
import { AchievementsModule } from '../achievements/achievements.module.js';
import { MatchesModule } from '../matches/matches.module.js';

@Module({
  imports: [AchievementsModule, MatchesModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
