import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
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
import { Pathway, UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
        hasSelectedPathway: true,
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
   * Logs in user by verifying credentials against Sterling WordPress Token API:
   * 1. Checks: POST https://sterlinglrs.com/wp-json/api/v1/token?username=...&password=...
   * 2. If valid, fetches user info from: GET https://sterlinglrs.com/wp-json/wp/v2/users/me?context=edit
   * 3. Automatically registers / updates user in local User table.
   */
  async login(dto: LoginDto, res: Response) {
    const username = (dto.username || dto.email || '').trim();
    const password = dto.password;

    if (!username || !password) {
      throw new UnauthorizedException('Please enter both username and password.');
    }

    let authenticatedWpUser: {
      firstName: string;
      lastName: string;
      email: string;
      username: string;
    } | null = null;

    // 1. Authenticate with Sterling WordPress Token API
    try {
      const tokenUrl = `https://sterlinglrs.com/wp-json/api/v1/token?username=${encodeURIComponent(
        username,
      )}&password=${encodeURIComponent(password)}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const tokenRes = await fetch(tokenUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeout);

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const jwtToken = tokenData.jwt_token || tokenData.token;

        if (jwtToken) {
          // 2. Fetch full profile from: https://sterlinglrs.com/wp-json/wp/v2/users/me?context=edit
          const meController = new AbortController();
          const meTimeout = setTimeout(() => meController.abort(), 7000);

          const meRes = await fetch(
            'https://sterlinglrs.com/wp-json/wp/v2/users/me?context=edit',
            {
              method: 'GET',
              signal: meController.signal,
              headers: {
                Authorization: `Bearer ${jwtToken}`,
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Accept: 'application/json',
              },
            },
          );
          clearTimeout(meTimeout);

          if (meRes.ok) {
            const meData = await meRes.json();
            authenticatedWpUser = {
              firstName: meData.first_name || meData.name || username,
              lastName: meData.last_name || '',
              email: meData.email ? meData.email.trim().toLowerCase() : '',
              username: meData.username || meData.slug || username,
            };
          }
        }
      }
    } catch (err: any) {
      this.logger.warn(`External Sterling auth request failed: ${err.message}`);
    }

    let user: any = null;

    if (authenticatedWpUser && authenticatedWpUser.email) {
      // Find or automatically create registered user in local database
      user = await this.prisma.user.findUnique({
        where: { email: authenticatedWpUser.email },
      });

      const passwordHash = await bcrypt.hash(password, 10);

      if (!user) {
        // Register new user from Sterling WordPress profile
        user = await this.prisma.user.create({
          data: {
            email: authenticatedWpUser.email,
            firstName: authenticatedWpUser.firstName,
            lastName: authenticatedWpUser.lastName,
            passwordHash,
            isEmailVerified: true,
            status: UserStatus.ACTIVE,
            role: UserRole.USER,
            activePathway: Pathway.EMPLOYMENT,
          },
        });

        // Ensure CommonProfile exists
        await this.prisma.commonProfile.create({
          data: {
            user: { connect: { id: user.id } },
            locationCountry: 'Nigeria',
            nationalities: JSON.stringify(['Nigeria']),
            highestQualification: '',
            fieldOfStudy: '',
          },
        });
      } else {
        // Update user profile in local DB
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: authenticatedWpUser.firstName || user.firstName,
            lastName: authenticatedWpUser.lastName || user.lastName,
            passwordHash,
            status: UserStatus.ACTIVE,
          },
        });
      }
    } else {
      // If external Sterling auth returned invalid:
      // Check if it matches an existing administrative account in local DB (e.g. system admins)
      const localUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: username.toLowerCase() }],
        },
      });

      if (
        localUser &&
        (localUser.role === UserRole.ADMIN || localUser.role === UserRole.SUPER_ADMIN)
      ) {
        const isMatch = await bcrypt.compare(password, localUser.passwordHash);
        if (isMatch) {
          user = localUser;
        }
      }

      if (!user) {
        throw new UnauthorizedException(
          'Invalid username or password. If you do not have an account yet, please register',
        );
      }
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'This account has been suspended. Please contact support.',
      );
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
      hasSelectedPathway: (user as any).hasSelectedPathway ?? false,
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
        hasSelectedPathway: true,
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
      data: { activePathway: pathway, hasSelectedPathway: true },
      select: {
        id: true,
        activePathway: true,
        hasSelectedPathway: true,
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
