import { RmqOptions, Transport } from '@nestjs/microservices';

export function rmqOptions(url: string, queue: string, noAck = true): RmqOptions {
  return {
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue: queue,
      noAck: noAck, // Forces the consumer to acknowledge messages automatically, which can lead to message loss if the consumer crashes before processing the message. Set to false for manual acknowledgment.
      queueOptions: {
        durable: true, // The queue survives even if the RabbitMQ Docker container restarts
      },
    },
  };
}
