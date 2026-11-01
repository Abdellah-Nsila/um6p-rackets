import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_COOKIE } from '@app/common';
import { parseCookie } from 'cookie';
import type { Socket } from 'socket.io';
import type { JwtPayload } from '@app/contracts';

@Injectable()
export class WsAuthService {
  constructor(private readonly jwt: JwtService) {}

  async authenticate(socket: Socket): Promise<string> {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      throw new UnauthorizedException('Authentication cookie missing');
    }

    const cookies = parseCookie(cookieHeader);
    const token = cookies[ACCESS_COOKIE];

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      }); 

      const id = Number(payload.sub);

      if (!Number.isSafeInteger(id) || id <= 0 || !payload.login) {
        throw new Error('Invalid access token');
      }

      return String(id);
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}