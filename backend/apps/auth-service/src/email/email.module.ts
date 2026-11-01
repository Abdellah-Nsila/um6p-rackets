import { Module } from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service.js';
import { TRANSPORTER_TOKEN } from '@app/contracts/queues.js';
import { smtpConfig } from '@app/common';

@Module({
  providers: [
    {
      provide: TRANSPORTER_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Retrieve the strongly-typed config object
        const smtp = configService.getOrThrow<ConfigType<typeof smtpConfig>>('smtp');
        
        return nodemailer.createTransport({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.secure,
          auth: {
            user: smtp.user,
            pass: smtp.pass,
          },
        });
      },
    },
    EmailService,
  ],
  exports: [EmailService],
})
export class EmailModule {}