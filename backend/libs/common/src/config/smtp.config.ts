import { registerAs } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';

// I move it here since notification can use it too, and it is not auth specific.
export const smtpConfig = registerAs('smtp', () => {
  const readSecret = (filePath?: string): string => {
    return filePath && existsSync(filePath) ? readFileSync(filePath, 'utf8').trim() : '';
  };

  const host = process.env.SMTP_HOST;
  const portString = process.env.SMTP_PORT || '587';
  const port = parseInt(portString, 10);
  
  const secureString = process.env.SMTP_SECURE || 'false';
  const secure = secureString === 'true';

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS || readSecret(process.env.SMTP_PASSWORD_FILE);
  const fromEmail = process.env.SMTP_FROM_EMAIL;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!host || !user || !pass) {
    console.warn('SMTP credentials are missing. Email delivery will fail.');
  }

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromEmail,
    frontendUrl,
  };
});