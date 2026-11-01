import {
    AUTH_PATTERNS,
    AUTH_SERVICE,
    AuthResult,
    AuthTokens,
    LoginDto,
    RegisterDto,
    User,
    HealthResult,
    SuccessResult,
    ForgetPasswordDto,
    ResetPasswordDto,
} from '@app/contracts';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    Inject,
    Post,
    Query,
    Req,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { rpc } from '../../../../libs/common/src/helpers/rpc.helper.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Throttle } from '@nestjs/throttler';
import {
    clearAuthCookies,
    setAuthCookies,
    setCookie,
    clearCookie,
} from './cookies.js';
import type { Request, Response } from 'express';
import {
    type AuthenticatedUser,
    OAUTH_COOKIE,
    OAUTH_COOKIE_PATH,
    OAUTH_TTL_SECONDS,
    REFRESH_COOKIE,
    REQUEST_LIMIT,
    REQUEST_TTL,
} from '@app/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { GoogleOAuthService } from './google-oauth.service.js';
import googleOauthConfig from '../common/config/google-oauth.config.js';
import { type ConfigType } from '@nestjs/config';
import { safeReturnTo } from '@app/common/helpers/safe-return-to.js';

@Controller('auth')
export class AuthController {
    constructor(
        @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
        private readonly googleOAuthService: GoogleOAuthService,
        @Inject(googleOauthConfig.KEY)
        private cfg: ConfigType<typeof googleOauthConfig>,
    ) { }

    @Public()
    @Get('health')
    async health(): Promise<HealthResult> {
        return rpc<HealthResult>(this.authClient, AUTH_PATTERNS.HEALTH, {});
    }

    @Public()
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } }) // REQUEST_LIMIT requests per REQUEST_TTL seconds
    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ user: User }> {
        const { user, ...tokens } = await rpc<AuthResult>(
            this.authClient,
            AUTH_PATTERNS.REGISTER,
            dto,
        );
        setAuthCookies(res, tokens);

        return { user };
    }

    @Public()
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @HttpCode(200)
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<{ user: User }> {
        const { user, ...tokens } = await rpc<AuthResult>(
            this.authClient,
            AUTH_PATTERNS.LOGIN,
            dto,
        );
        setAuthCookies(res, tokens);

        return { user };
    }

    @Public()
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @HttpCode(200)
    @Post('refresh')
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<void> {
        const refresh_token = req.cookies?.[REFRESH_COOKIE];
        if (!refresh_token) throw new UnauthorizedException();

        try {
            const tokens = await rpc<AuthTokens>(
                this.authClient,
                AUTH_PATTERNS.REFRESH,
                { refresh_token },
            );
            setAuthCookies(res, tokens);
        } catch (err) {
            // If the backend throws a 401 (e.g., token reuse detected or expired),
            // FORCE the browser to delete the tokens so they can't access /me anymore.
            // The hacker still holds an Access Token that is mathematically valid for x time ): , but they can't refresh it anymore, and the Access Token will expire soon (:
            clearAuthCookies(res);
            throw err;
        }
    }

    @Public()
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Get('google/login')
    async googleLogin(@Query('returnTo') returnTo: unknown, @Res() res: Response): Promise<void> {
        const { url, token } = await this.googleOAuthService.getAuthorizationUrl(safeReturnTo(returnTo));
        setCookie(res, OAUTH_COOKIE, token, OAUTH_TTL_SECONDS, OAUTH_COOKIE_PATH);
        res.redirect(url);
    }

    @Public()
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Get('google/callback')
    async googleCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Query('error') error: string,
        @Req() req: Request,
        @Res() res: Response
    ): Promise<void> {
        if (error === 'access_denied') {
              return res.redirect(new URL('?error=oauth_cancelled', this.cfg.frontendRedirectUrl).toString());
        }
        try {
            const { profile, returnTo } = await this.googleOAuthService.verifyCallback(
                { code, state },
                req.cookies?.[OAUTH_COOKIE]
            );
            const { user, ...tokens } = await rpc<AuthResult>(this.authClient, AUTH_PATTERNS.OAUTH_LOGIN, profile);
            clearCookie(res, OAUTH_COOKIE, OAUTH_COOKIE_PATH);
            setAuthCookies(res, tokens);
            const dest = new URL(returnTo, this.cfg.frontendRedirectUrl);
            dest.searchParams.set('oauth', 'success');
            res.redirect(dest.toString());
        } catch (err) {
            console.error('[GoogleOAuth Error]', err);
            clearCookie(res, OAUTH_COOKIE, OAUTH_COOKIE_PATH);
            res.redirect(new URL('?error=oauth_failed', this.cfg.frontendRedirectUrl).toString());
        }
    }

    @HttpCode(200)
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Post('logout')
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): Promise<SuccessResult> {
        const msg = await rpc<SuccessResult>(this.authClient, AUTH_PATTERNS.LOGOUT, {
            refreshToken: req.cookies?.[REFRESH_COOKIE] ?? '',
        });
        clearAuthCookies(res);
        return msg;
    }

    @Public()
    @HttpCode(202)
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Post('forget-password')
    async forgetPassword(@Body() dto: ForgetPasswordDto): Promise<SuccessResult> {
        return await rpc<SuccessResult>(this.authClient, AUTH_PATTERNS.FORGET_PASSWORD, { email: dto.email });
    }

    @Public()
    @HttpCode(200)
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Post('reset-password')
    async resetPassword(
        @Body() dto: ResetPasswordDto,
        // @Res({ passthrough: true }) res: Response,
    ): Promise<SuccessResult> {
        return await rpc<SuccessResult>(this.authClient, AUTH_PATTERNS.RESET_PASSWORD, {
            token: dto.token,
            password: dto.password,
        });
    }

    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Get('me')
    async me(@CurrentUser() authenticatedUser: AuthenticatedUser): Promise<{ user: User }> {
        const user = await rpc<User>(this.authClient, AUTH_PATTERNS.GET_USER_BY_ID, {
            user_id: authenticatedUser.id,
        });
        return { user };
    }

    @Public()
    @Throttle({ default: { limit: REQUEST_LIMIT, ttl: REQUEST_TTL } })
    @Get('login-available')
    async isLoginAvailable(@Query('login') login: string): Promise<{ available: boolean }> {
        const available = await rpc<boolean>(this.authClient, AUTH_PATTERNS.IS_LOGIN_AVAILABLE, {
            login: login,
        });
        return { available };
    }
}
