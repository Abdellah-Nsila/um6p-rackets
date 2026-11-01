// auth-client.module.ts
import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AUTH_SERVICE, NOTIFICATION_SERVICE, QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url');
          return rmqOptions(rmqUrl, QUEUES.AUTH, true);
        },
      },
    ]),
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_SERVICE,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.getOrThrow<string>('rabbitmq.url');
          return rmqOptions(rmqUrl, QUEUES.NOTIFICATION, true);
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RPCClientsModule {}