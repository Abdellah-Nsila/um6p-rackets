import { TRANSPORTER_TOKEN } from '@app/contracts';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { getPasswordResetTemplate } from './template/email.templates.js';

@Injectable()
export class EmailService {
    constructor(
    @Inject(TRANSPORTER_TOKEN) private readonly transporter: nodemailer.Transporter,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordReset(email: string, rawToken: string): Promise<void> {
    const smtp = this.configService.get('smtp');

    const resetLink = `${smtp.frontendUrl}/reset-password?token=${rawToken}`;
    const htmlTemplate = getPasswordResetTemplate(resetLink);
    const senderEmail = smtp.fromEmail;

    try {
      const info = await this.transporter.sendMail({
        from: `"Rackets Support" <${senderEmail}>`,
        to: email,
        subject: 'Reset your password',
        html: htmlTemplate,
      });
      console.log(`Password reset email sent to ${email}`);
      // Print the Ethereal preview link directly in the terminal!`
      if (this.configService.get('SMTP_HOST').includes('ethereal')) {
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
    }
  }
}
