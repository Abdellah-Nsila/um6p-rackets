// apps/api-gateway/src/common/config/google-oauth.config.ts
import { registerAs } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';

export default registerAs('googleOAuth', () => {
  const readSecret = (filePath?: string): string => {
    return filePath && existsSync(filePath) ? readFileSync(filePath, 'utf8').trim() : '';
  };

  const clientId = process.env.GOOGLE_CLIENT_ID || readSecret(process.env.GOOGLE_CLIENT_ID_FILE);
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || readSecret(process.env.GOOGLE_CLIENT_SECRET_FILE);
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const frontendRedirectUrl = process.env.FRONTEND_REDIRECT_URL || readSecret(process.env.FRONTEND_REDIRECT_URL_FILE);
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are missing in the Gateway configuration.');
  }

  return {
    clientId,
    clientSecret,
    redirectUri: redirectUri,
    frontendRedirectUrl: frontendRedirectUrl,
  };
});