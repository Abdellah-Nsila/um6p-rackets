// -> apps/api-gateway/src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { AUTH_SERVICE, CLUB_SERVICE, QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url')!;
          return rmqOptions(rmqUrl, QUEUES.AUTH, true);
        },
      },
      {
        name: CLUB_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url')!;
          return rmqOptions(rmqUrl, QUEUES.CLUB, true);
        },
      },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}