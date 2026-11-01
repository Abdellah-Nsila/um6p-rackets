import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { ACCESS_COOKIE, type AuthenticatedUser } from '@app/common';
import { type JwtPayload } from '@app/contracts';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService, private readonly reflector: Reflector) {}

    async canActivate(ctx: ExecutionContext): Promise<boolean> {
        // 1. Check if the route is marked with @Public()
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            ctx.getHandler(), 
            ctx.getClass(),
        ]);
        if (isPublic) return true;

        const req = ctx.switchToHttp().getRequest();

        // 2. DEV BYPASS: Allow x-user-id header ONLY in development
        // if (process.env.NODE_ENV !== 'production' && req.headers['x-user-id']) {
        //     const id = Number(req.headers['x-user-id']);
        //     if (Number.isInteger(id) && id > 0) {
        //         // Fake the user object to satisfy the AuthenticatedUser interface
        //         req.user = { id, login: `dev_user_${id}` } satisfies AuthenticatedUser;
        //         return true;
        //     }
        // }

        // 3. PRODUCTION FLOW: Extract and verify the JWT
        const token = req.cookies?.[ACCESS_COOKIE];
        if (!token)
            throw new UnauthorizedException('Authentication token missing');

        try {
            const payload = await this.jwt.verifyAsync<JwtPayload>(token, { algorithms: ['HS256'] });
            const id = Number(payload.sub);
            // JwtAuthGuard still accepts the OAuth cookie token as an access token we don't want to accept it
            if (!Number.isInteger(id) || id <= 0 || !payload.login) {
                throw new Error('not an access token');
            }
            req.user = { id, login: payload.login, role: payload.role } satisfies AuthenticatedUser
            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired authentication token');
        }
    }
}