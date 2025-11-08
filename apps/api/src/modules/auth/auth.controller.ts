import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60, limit: 5 } }) // 5 requests per 60 seconds
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.socket.remoteAddress;

    const result = await this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
      userAgent,
      ipAddress,
    );

    // Set refresh token as HttpOnly cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: 60, limit: 10 } }) // 10 requests per 60 seconds
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.socket.remoteAddress;

    const result = await this.authService.login(loginDto.email, loginDto.password, userAgent, ipAddress);

    // Set refresh token as HttpOnly cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      message: 'Logged in successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    };
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request & { refreshTokenPayload: RefreshTokenPayload },
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = request.cookies['refreshToken'];
    const payload = request.refreshTokenPayload;
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.socket.remoteAddress;

    const tokens = await this.authService.refreshTokens(oldRefreshToken, payload, userAgent, ipAddress);

    // Set new refresh token as HttpOnly cookie
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.['refreshToken'];

    if (refreshToken) {
      try {
        // Extract jti from refresh token without verification (we just need to revoke)
        const decoded = JSON.parse(
          Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
        );
        await this.authService.logout(decoded.jti);
      } catch (error) {
        // Ignore errors - still clear cookie
      }
    }

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser('sub') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logoutAll(userId);

    // Clear refresh token cookie
    response.clearCookie('refreshToken');

    return {
      success: true,
      message: 'Logged out from all devices successfully',
    };
  }

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: { user },
    };
  }

  @Public()
  @Get('csrf-token')
  async getCsrfToken(@Req() request: Request) {
    // CSRF token is generated by middleware and attached to request
    return {
      success: true,
      data: {
        csrfToken: request['csrfToken']?.(),
      },
    };
  }
}
