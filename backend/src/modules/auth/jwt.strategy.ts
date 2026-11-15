import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private userCache = new Map<string, { user: any; expiresAt: number }>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Extract from Cookie
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['access_token'];
          }
          return token;
        },
        // 2. Fallback to Authorization: Bearer <token>
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>(
        'JWT_ACCESS_SECRET',
        'sterling_connect_jwt_access_secret_super_secure_key_change_in_prod',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    const now = Date.now();
    const cached = this.userCache.get(payload.sub);
    if (cached && cached.expiresAt > now) {
      if (cached.user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Account not found or access suspended.');
      }
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        activePathway: true,
        hasCompletedAssessment: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    if (!user || user.status === 'SUSPENDED') {
      this.userCache.delete(payload.sub);
      throw new UnauthorizedException('Account not found or access suspended.');
    }

    // Cache valid user for 15 seconds to prevent connection pool exhaustion during concurrent API requests
    this.userCache.set(payload.sub, { user, expiresAt: now + 15000 });

    return user;
  }
}
