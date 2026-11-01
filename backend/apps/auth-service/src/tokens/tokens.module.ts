import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { TokensService } from './tokens.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { jwtConfig } from '@app/common';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      global: true,
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>) => config,
    }),
  ],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}