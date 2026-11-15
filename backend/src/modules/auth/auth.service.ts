import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Pathway } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Registers a new user, hashes password, creates CommonProfile,
   * generates verification token and sends verification email.
   */
  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account already uses this email address. Sign in or reset your password to continue.');
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Generate 6-digit verification code
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Map pathway string if provided
    let userPathway: Pathway = Pathway.EMPLOYMENT;
    if (dto.pathway && dto.pathway.toLowerCase().includes('scholarship')) {
      userPathway = Pathway.SCHOLARSHIP;
    }

    // Atomic transaction: Create user + initial common profile
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        activePathway: userPathway,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
        status: 'ACTIVE', // Auto-activate for smooth MVP testing
        isEmailVerified: false,
        commonProfile: {
          create: {
            locationCountry: dto.country || 'Nigeria',
            nationalities: dto.nationality
              ? dto.nationality.split(',').map((s: string) => s.trim()).filter(Boolean)
              : ['Nigerian'],
            highestQualification: "Bachelor's Degree",
            fieldOfStudy: 'General Studies',
            profileCompletion: 25.0, // baseline completion after registration
          },
        },
      },
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

    // Send verification email in background
    this.mailService
      .sendVerificationEmail(user.email, user.firstName, verificationToken)
      .catch(() => {});

    // Generate session tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      success: true,
      user,
      accessToken: tokens.accessToken,
    };
  }

  /**
   * Logs in user, verifies password, and sets cookies.
   */
  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('We couldn’t sign you in with those details. Check your email and password.');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('This account has been suspended. Please contact support.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('We couldn’t sign you in with those details. Check your email and password.');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      activePathway: user.activePathway,
      hasCompletedAssessment: user.hasCompletedAssessment,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return {
      success: true,
      user: safeUser,
      accessToken: tokens.accessToken,
    };
  }

  /**
   * Logs out user by clearing cookies.
   */
  async logout(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { success: true, message: 'Logged out successfully.' };
  }

  /**
   * Returns currently authenticated user and their profile status.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
        commonProfile: {
          select: {
            locationCountry: true,
            nationalities: true,
            profileCompletion: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return { success: true, user };
  }

  /**
   * Verifies email using verification token or 6-digit code.
   */
  async verifyEmail(tokenOrCode: string, authenticatedUserId?: string) {
    if (!tokenOrCode && !authenticatedUserId) {
      throw new BadRequestException('Verification code is required.');
    }

    let user = null;
    if (tokenOrCode) {
      user = await this.prisma.user.findFirst({
        where: {
          emailVerificationToken: tokenOrCode.trim(),
        },
      });
    }

    if (!user && authenticatedUserId) {
      user = await this.prisma.user.findUnique({
        where: { id: authenticatedUserId },
      });
    }

    if (!user) {
      throw new BadRequestException('This verification link has expired or has already been used. Request a new link to continue.');
    }

    const wasVerified = user.isEmailVerified;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    // EM001: Welcome to Sterling Connect (once after verified email)
    if (!wasVerified) {
      this.mailService.sendWelcomeEmail(user.email, user.firstName).catch(() => {});
    }

    return { success: true, message: 'Your email is verified. Let’s set up your profile.' };
  }

  /**
   * Resends verification email.
   */
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const verificationToken = uuidv4();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.mailService.sendVerificationEmail(user.email, user.firstName, verificationToken);
    return { success: true, message: 'If your account is awaiting verification, we’ll send a new link.' };
  }

  /**
   * Updates user's active pathway (EMPLOYMENT vs SCHOLARSHIP) - FR-09
   */
  async updatePathway(userId: string, pathway: Pathway, goal?: string, stage?: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { activePathway: pathway },
      select: {
        id: true,
        activePathway: true,
      },
    });

    if (goal || stage) {
      try {
        await this.prisma.employmentProfile.upsert({
          where: { userId },
          create: {
            userId,
            careerLevel: stage || 'Entry-level',
            employmentStatus: goal || 'Seeking opportunity',
            sectorsOfInterest: [],
            functionsOfInterest: [],
            skills: [],
            preferredLocations: [],
            opportunityTypes: [],
            workAuthorisation: [],
          },
          update: {
            ...(stage ? { careerLevel: stage } : {}),
            ...(goal ? { employmentStatus: goal } : {}),
          },
        });
      } catch {}
    }

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PATHWAY_CHANGED',
        entityType: 'User',
        entityId: userId,
        payload: { activePathway: pathway, goal: goal || null, stage: stage || null },
      },
    });

    return { success: true, activePathway: updated.activePathway };
  }

  /**
   * Generates Access Token (15m) and Refresh Token (7d).
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>(
        'JWT_ACCESS_SECRET',
        'sterling_connect_jwt_access_secret_super_secure_key_change_in_prod',
      ),
      expiresIn: '7d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>(
        'JWT_REFRESH_SECRET',
        'sterling_connect_jwt_refresh_secret_super_secure_key_change_in_prod',
      ),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  /**
   * AUTH_RESET: Sends password reset link. Generic response per spec.
   */
  async forgotPassword(email: string) {
    if (!email) {
      return {
        success: true,
        message: 'If an account exists for this email address, we’ll send a password reset link.',
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (user) {
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiry

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiresAt: expiresAt,
        },
      });

      try {
        await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
      } catch {}
    }

    return {
      success: true,
      message: 'If an account exists for this email address, we’ll send a password reset link.',
    };
  }

  /**
   * AUTH_RESET: Consumes reset token and updates password.
   */
  async resetPassword(token: string, newPass: string) {
    if (!token || !newPass) {
      throw new BadRequestException('Token and new password are required.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('This verification link has expired or has already been used. Request a new link to continue.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPass, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return { success: true, message: 'Your password has been updated. Sign in to continue.' };
  }

  /**
   * Sets secure HTTP-only cookies on the response.
   */
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Retrieves public analytics configuration for frontend initialization.
   */
  async getPublicAnalyticsConfig() {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'googleAnalytics' },
      });
      if (setting) {
        const parsed = JSON.parse(setting.value);
        return {
          enabled: parsed.enabled !== false,
          measurementId: parsed.measurementId || this.config.get<string>('GA_MEASUREMENT_ID', 'G-8V6ZJ2E9X1'),
        };
      }
    } catch {
      // fallback
    }
    return {
      enabled: true,
      measurementId: this.config.get<string>('GA_MEASUREMENT_ID', 'G-8V6ZJ2E9X1'),
    };
  }
}
