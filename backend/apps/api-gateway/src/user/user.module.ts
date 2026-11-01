import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { AUTH_SERVICE, CLUB_SERVICE, QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { AuthModule } from '../auth/auth.module.js';

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
    // This is the microservices module that registers the RabbitMQ client for the AuthService
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          // The ! is a TypeScript non-null assertion operator, which tells the compiler that the value is not null or undefined.
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url')!;
          return rmqOptions(rmqUrl, QUEUES.AUTH, true); // Forces the consumer to acknowledge messages automatically, which can lead to message loss if the consumer crashes before processing the message. Set to false for manual acknowledgment.
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
