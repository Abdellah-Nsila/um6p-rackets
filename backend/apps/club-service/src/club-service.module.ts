import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, envFiles } from '@app/common';
import { ClubServiceController } from './club-service.controller.js';
import { ClubServiceService } from './club-service.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { ClubAccessModule } from './access/club-access.module.js';
import { MembersModule } from './members/members.module.js';
import { RPCClientsModule } from './global-clients/rpc-clients.module.js';
import { AnnouncementsModule } from './announcements/announcements.module.js';
import { DocumentsModule } from './documents/documents.module.js';
import { AchievementsModule } from './achievements/achievements.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: envFiles('club-service'),
    }),
    PrismaModule,
    SessionsModule,
    ClubAccessModule,
    MembersModule,
    RPCClientsModule,
    AnnouncementsModule,
    DocumentsModule,
    AchievementsModule,
    MatchesModule,
    LeaderboardModule
  ],
  controllers: [ClubServiceController],
  providers: [
    {
      provide: ClubServiceService, // by default the provider token is the class name, i write it here just to explain
      useClass: ClubServiceService,
    }
  ]
})
export class ClubServiceModule {}
