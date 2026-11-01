import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ClubServiceModule } from './club-service.module.js';
import { QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';
import { AllRpcExceptionsFilter, configuration } from '@app/common';



async function bootstrap() {
  const { rabbitmq } = configuration();
  if (!rabbitmq.url) throw new Error('RABBITMQ_URL is not set');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ClubServiceModule,
    rmqOptions(rabbitmq.url, QUEUES.CLUB, true),

  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllRpcExceptionsFilter());
  app.enableShutdownHooks();
  await app.listen();
}

bootstrap();
