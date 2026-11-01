import { NestFactory } from '@nestjs/core';
import { AuthServiceModule } from './auth-service.module.js';
import { MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

import { QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';
import { AllRpcExceptionsFilter, configuration } from '@app/common';

async function bootstrap() {

  const { rabbitmq } = configuration();
  if (!rabbitmq.url) throw new Error('RABBITMQ_URL is missing in configuration');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthServiceModule,
    rmqOptions(rabbitmq.url, QUEUES.AUTH),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted: true, // Defense in Depth Pattern
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllRpcExceptionsFilter());
  app.enableShutdownHooks();

  await app.listen();
}
bootstrap();