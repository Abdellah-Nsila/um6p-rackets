import { ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import googleOauthConfig from "../common/config/google-oauth.config.js";
import { type ConfigType } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { randomBytes, timingSafeEqual } from "crypto";
import { OAuthAuthorizationPayload, OAuthLoginDto, OAuthTx } from "@app/contracts/auth/index.js";
import { OAUTH_AUDIENCE } from "@app/common/auth/auth.constants.js";


@Injectable()
export class GoogleOAuthService {
    private readonly oauth2client: OAuth2Client;

    constructor(
        @Inject(googleOauthConfig.KEY)
        private cfg: ConfigType<typeof googleOauthConfig>,
        private readonly jwt: JwtService,
    )  {
        this.oauth2client = new OAuth2Client(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
    }

    async getAuthorizationUrl(returnTo: string): Promise<OAuthAuthorizationPayload> {
        // Generate a code verifier and code challenge for PKCE
        const { codeVerifier, codeChallenge } = await this.oauth2client.generateCodeVerifierAsync();

        // Generate a random state and nonce for security (They must remain the same between the authorization request and the callback for CSRF protection)
        const state = randomBytes(24).toString('base64url');
        const nonce = randomBytes(24).toString('base64url');

        // Generate the authorization URL with the required parameters
        const url = this.oauth2client.generateAuthUrl({
            // openid: asking Google to verify their identity and issue a cryptographically signed ID Token
            // email: asking Google to provide their email address and be verified
            // profile: asking Google to provide their basic profile information (name, picture, etc.)
            scope: ['openid', 'email', 'profile'],
            state,
            nonce,
            code_challenge: codeChallenge,
            code_challenge_method: CodeChallengeMethod.S256,
            // Prompt the user to select an account if they are already logged in
            prompt: 'select_account',
        })

        // Create a JWT token to store the state, nonce, and code verifier for later verification
        // purpose: 'google-oauth' is used to identify the purpose of this token when verifying it later so that we can ensure that the token is being used for the correct purpose and not for any other malicious activity.
        const token = await this.jwt.signAsync(
            { purpose: OAUTH_AUDIENCE, state, nonce, codeVerifier, returnTo },
            { expiresIn: '10m', audience: OAUTH_AUDIENCE },
        );
        return { url, token };
    }

    async verifyCallback(
        query: { code?: unknown; state?: unknown },
        cookieToken?: unknown,
    ): Promise<{profile: OAuthLoginDto; returnTo: string}> {
        // Query params can be arrays or objects (?code[]=x): accept strings only.
        if (
        typeof query.code !== 'string' || !query.code ||
        typeof query.state !== 'string' || !query.state ||
        typeof cookieToken !== 'string' || !cookieToken
        ) {
        throw new UnauthorizedException('Missing OAuth code, state, or cookie');
        }
    
        // 3. Verify the JWT token from the cookie to retrieve the original state, nonce, and code verifier
        let saved: OAuthTx;
        try {
        saved = await this.jwt.verifyAsync<OAuthTx>(cookieToken, {
            audience: OAUTH_AUDIENCE,
        });
        } catch {
            throw new UnauthorizedException('Invalid or expired OAuth cookie');
        }

        const a = Buffer.from(saved.state);
        const b = Buffer.from(query.state);
        if (saved.purpose !== OAUTH_AUDIENCE || a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new UnauthorizedException('State mismatch');
        }

        let idToken: string | null | undefined;
        try {
            const { tokens } = await this.oauth2client.getToken({
                code: query.code,
                codeVerifier: saved.codeVerifier,
            });
            idToken = tokens.id_token;
        } catch (err: any) {
            // Typical causes: reused/expired code, redirect_uri mismatch. Never log the code.
            console.error('[Google Token Error]:', err.response?.data || err);
            throw new UnauthorizedException('Token exchange failed');
        }
        if (!idToken)
            throw new UnauthorizedException('No ID token');

       const ticket = await this.oauth2client
        .verifyIdToken({ idToken, audience: this.cfg.clientId })
        .catch(() => {
            throw new UnauthorizedException('Invalid ID token');
        });
        const payload = ticket.getPayload();

        if (!payload?.sub || !payload.email || payload.nonce !== saved.nonce) {
            throw new UnauthorizedException('Invalid ID token claims');
        }
        if (!payload.email_verified) {
         throw new ForbiddenException('Google email is not verified');
        }

        return {
            profile: {
                provider: 'google',
                subject: payload.sub,
                email: payload.email,
                email_verified: true,
                first_name: payload.given_name ?? '',
                last_name: payload.family_name ?? '',
                picture: payload.picture ?? null,
            },
            returnTo: saved.returnTo,
        };
    }
}