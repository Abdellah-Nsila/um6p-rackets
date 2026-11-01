import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { configuration, envFiles } from '@app/common';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationServiceService } from './notification-service.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { GATEWAY_SERVICE, QUEUES } from '@app/contracts/queues.js';
import { rmqOptions } from '@app/rmq';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: envFiles('notification-service'),
    }),
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: GATEWAY_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url')!;
          return rmqOptions(rmqUrl, QUEUES.GATEWAY, true);
        },
      },
    ]),
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService],
})
export class NotificationServiceModule {}
