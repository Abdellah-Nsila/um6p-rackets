import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { CLUB_SERVICE, QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';
import { ClubController } from './club.controller.js';
import { ClubAchievementController } from './club-achievements.controller.js';
import { ClubAnnouncementsController } from './club-announcements.controller.js';
import { ClubDocumentsController } from './club-documents.controller.js';
import { ClubMembersController } from './club-members.controller.js';
import { ClubSessionsController } from './club-sessions.controller.js';
import { ClubMatchesController } from './club-matches.controller.js';

@Module({
  imports: [
    // This is the microservices module that registers the RabbitMQ client for the AuthService
    ClientsModule.registerAsync([
      {
        name: CLUB_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          // The ! is a TypeScript non-null assertion operator, which tells the compiler that the value is not null or undefined.
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url')!;
          return rmqOptions(rmqUrl, QUEUES.CLUB, true); // Forces the consumer to acknowledge messages automatically, which can lead to message loss if the consumer crashes before processing the message. Set to false for manual acknowledgment.
        },
      },
    ]),
  ],
  controllers: [
    ClubController,
    ClubAchievementController,
    ClubAnnouncementsController,
    ClubMembersController,
    ClubDocumentsController,
    ClubMembersController,
    ClubSessionsController,
    ClubMatchesController,
  ],
})
export class ClubModule {}
