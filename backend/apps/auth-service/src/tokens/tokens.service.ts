  import { Injectable } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { PrismaService } from '../prisma/prisma.service.js';
  import { randomBytes, createHash, randomUUID, hash } from 'crypto';
  import { AuthTokens, rpcError } from '@app/contracts';

  @Injectable()
  export class TokensService {
    constructor(
      private readonly jwt: JwtService,
      private readonly prisma: PrismaService,
    ) {}

    // 1. Initial Login
    async issue(user_id: number, login: string, role: string): Promise<AuthTokens> {
      return this.generateAndSaveTokens(user_id, login, role, randomUUID());
    }

    // 2. Refresh Token Rotation
    async rotate(plainRefreshToken: string): Promise<AuthTokens> {
      const tokenHash = createHash('sha256').update(plainRefreshToken).digest('hex');
      
      // Find the token and join the user table to get the login string for the new JWT
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token_hash: tokenHash },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw rpcError(401, 'Invalid refresh token', 'Unauthorized');
      }

      // Security Check 1: If the token is already revoked, revoke the entire family and throw an error.
      if (tokenRecord.is_revoked) {
        await this.revokeTokenFamily(tokenRecord.family_id);
        throw rpcError(401, 'Token reuse detected. Please log in again.', 'Unauthorized');
      }

      if (tokenRecord.expires_at < new Date()) {
        throw rpcError(401, 'Refresh token expired', 'Unauthorized');
      }

      // Security Check 2: Revoke the token in an atomic operation to prevent race conditions.
      // ATOMIC UPDATE (The Race Condition Fix)
      // We attempt to revoke it, but ONLY if it is still currently false.
      const { count } = await this.prisma.refreshToken.updateMany({
        where: { 
          id: tokenRecord.id, 
          is_revoked: false 
        },
        data: { is_revoked: true },
      });

      // The Race Condition Alarm
      if (count === 0) {
        // We lost the race. Another parallel request revoked it milliseconds ago.
        // This is an active attack.
        await this.revokeTokenFamily(tokenRecord.family_id);
        throw rpcError(401, 'Concurrent token reuse detected. Please log in again.', 'Unauthorized');
      }

      // Issue a new token pair in the SAME family
      return this.generateAndSaveTokens(tokenRecord.user_id, tokenRecord.user.login, tokenRecord.user.role , tokenRecord.family_id);
    }

    // 3. Logout
    async revoke(plainRefreshToken: string): Promise<void> {
      const tokenHash = createHash('sha256').update(plainRefreshToken).digest('hex');
      
      // updateMany doesn't throw an error if the token doesn't exist
      await this.prisma.refreshToken.updateMany({
        where: { token_hash: tokenHash },
        data: { is_revoked: true },
      });
    }

    // 4. Password Reset Token
    async issuePasswordResetToken(user_id: number): Promise<string> {
      const rowToken = randomBytes(32).toString('base64url');
      const tokenHash = createHash('sha256').update(rowToken).digest('hex');
      
      const expiresAt = new Date();
      // Set the expiry to 15 min from now
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await this.prisma.user.update({
        where: { id: user_id },
        data: {
          reset_token_hash: tokenHash,
          reset_token_expiry: expiresAt,
        },
      });
      return rowToken;  
    }

    // 5. Validate Password Reset Token
    async validatePasswordResetToken(rawToken: string): Promise<number | null> {
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const user = await this.prisma.user.findFirst({
        where: { reset_token_hash: tokenHash },
        select: { id: true, reset_token_expiry: true },
      });
      if ((!user) || (!user.reset_token_expiry) || new Date() > user.reset_token_expiry) {
        return null;
      }
      return user.id;
    }

    // --- Private Helper ---
    private async generateAndSaveTokens(user_id: number, login: string, role: string, familyId: string): Promise<AuthTokens> {
      const accessToken = await this.jwt.signAsync( { sub: String(user_id), login, role } );

      const plainRefreshToken = randomBytes(48).toString('base64url');
      const tokenHash = createHash('sha256').update(plainRefreshToken).digest('hex');
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await this.prisma.refreshToken.create({
        data: {
          token_hash: tokenHash,
          family_id: familyId,
          user_id: user_id,
          expires_at: expiresAt,
          is_revoked: false,
          created_at: new Date(),
        },
      });

      return { access_token: accessToken, refresh_token: plainRefreshToken };
    }

    private async revokeTokenFamily(familyId: string) {
      await this.prisma.refreshToken.updateMany({
        where: { family_id: familyId },
        data: { is_revoked: true },
      });
    }
  }