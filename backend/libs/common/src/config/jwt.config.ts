import { registerAs } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { readFileSync, existsSync } from 'fs';

export const jwtConfig = registerAs('jwt', (): JwtModuleOptions => {
  const readSecret = (filePath?: string): string => {
    return filePath && existsSync(filePath) ? readFileSync(filePath, 'utf8').trim() : '';
  };

  const secret = process.env.JWT_ACCESS_SECRET || readSecret(process.env.JWT_ACCESS_SECRET_FILE);
  // Strict type casting without 'any'
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN as JwtSignOptions['expiresIn'];

  if (!secret) {
    throw new Error('JWT access secret is missing.');
  }

  // We construct the exact configuration object NestJS expects
  return {
    secret,
    signOptions: { expiresIn },
    verifyOptions: { algorithms: ['HS256'] },
  };
});