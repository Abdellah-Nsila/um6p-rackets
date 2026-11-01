import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthServiceService } from './auth-service.service.js';
import { AuthServiceController } from './auth-service.controller.js';
import { configuration, envFiles, jwtConfig, smtpConfig  } from '@app/common';

// Sub-modules
import { UsersModule } from './users/users.module.js';
import { TokensModule } from './tokens/tokens.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { EmailModule } from './email/email.module.js';
import { AdminModule } from './admin/admin.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, jwtConfig, smtpConfig],
      envFilePath: envFiles('auth-service'),
      isGlobal: true
    }),
    UsersModule,
    TokensModule,
    PrismaModule,
    EmailModule,
    AdminModule,
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
