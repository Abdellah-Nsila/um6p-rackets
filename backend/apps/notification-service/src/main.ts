import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NotificationServiceModule } from './notification-service.module.js';
import { QUEUES } from '@app/contracts';
import { rmqOptions } from '@app/rmq';
import { AllRpcExceptionsFilter, configuration } from '@app/common';

async function bootstrap() {
  const { rabbitmq } = configuration();
  if (!rabbitmq.url) throw new Error('RABBITMQ_URL is not set');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    rmqOptions(rabbitmq.url, QUEUES.NOTIFICATION, true),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllRpcExceptionsFilter());
  app.enableShutdownHooks();
  await app.listen();
  Logger.log(`Notification Service is running on RabbitMQ queue: ${QUEUES.NOTIFICATION}`);
}
bootstrap();
