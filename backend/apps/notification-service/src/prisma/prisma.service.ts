// Owns the Prisma Client instance used to query PostgreSQL.
// we expose  Prisma Client through a provider. Create a PrismaService class that extends PrismaClient, so that the service has the full Prisma Client API
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client.js';

import { configuration } from '@app/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = configuration().database.url;
    const schema = new URL(url).searchParams.get('schema') ?? undefined;
    super({
      adapter: new PrismaPg({ connectionString: url }, { schema }),
    });
  }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}