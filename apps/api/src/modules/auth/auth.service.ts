import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import type { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    name?: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, undefined, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password with Argon2
    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, undefined, userAgent, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  async refreshTokens(oldRefreshToken: string, payload: RefreshTokenPayload, userAgent?: string, ipAddress?: string) {
    // Verify refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (!storedToken) {
      // Token not found - possible reuse attack
      await this.revokeTokenFamily(payload.familyId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      // Token was revoked - possible reuse attack
      await this.revokeTokenFamily(payload.familyId);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      // Token expired
      throw new UnauthorizedException('Refresh token expired');
    }

    // Verify token hash matches
    const isValid = await argon2.verify(storedToken.tokenHash, oldRefreshToken);

    if (!isValid) {
      // Token hash mismatch - possible tampering
      await this.revokeTokenFamily(payload.familyId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new tokens with same familyId
    const tokens = await this.generateTokens(
      payload.sub,
      payload.email,
      payload.familyId,
      userAgent,
      ipAddress,
    );

    return tokens;
  }

  async logout(jti: string) {
    // Revoke the refresh token
    await this.prisma.refreshToken.updateMany({
      where: { jti },
      data: { isRevoked: true },
    });
  }

  async logoutAll(userId: string) {
    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    familyId?: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
    };

    // Generate access token (short-lived)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    // Generate refresh token (long-lived)
    const jti = randomUUID();
    const refreshFamilyId = familyId || randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      ...payload,
      jti,
      familyId: refreshFamilyId,
    };

    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Store refresh token hash in database
    const tokenHash = await argon2.hash(refreshToken);
    const expiresIn = this.parseExpiration(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
    const expiresAt = new Date(Date.now() + expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: refreshFamilyId,
        jti,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    // Clean up expired tokens
    await this.cleanupExpiredTokens();

    return {
      accessToken,
      refreshToken,
    };
  }

  private async revokeTokenFamily(familyId: string) {
    // Revoke all tokens in the family
    await this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }

  private async cleanupExpiredTokens() {
    // Delete expired tokens older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: thirtyDaysAgo },
      },
    });
  }

  private parseExpiration(expiration: string): number {
    const regex = /^(\d+)([smhd])$/;
    const match = expiration.match(regex);

    if (!match) {
      throw new BadRequestException('Invalid expiration format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new BadRequestException('Invalid expiration unit');
    }
  }
}
