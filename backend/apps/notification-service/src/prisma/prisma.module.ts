// Registers and exports PrismaService through NestJS dependency injection.
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}   