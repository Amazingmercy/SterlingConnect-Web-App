import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  UpdateApplicationNotesDto,
} from './dto/application.dto';
import { ApplicationStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PushNotificationsService } from '../notifications/push-notifications.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly pushService: PushNotificationsService,
  ) {}

  /**
   * Helper to resolve opportunity by UUID or referenceCode
   */
  private async resolveOpportunity(idOrCode: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: {
        OR: [{ id: idOrCode }, { referenceCode: idOrCode }],
      },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity '${idOrCode}' not found.`);
    }

    return opp;
  }

  /**
   * Resilient execution wrapper with retry for MySQL/TiDB lock wait timeouts (Error 1205)
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      const isLockError =
        err?.code === 1205 ||
        err?.code === '1205' ||
        err?.message?.includes('Lock wait timeout') ||
        err?.message?.includes('1205');
      if (retries > 0 && isLockError) {
        this.logger.warn(`Database lock contention detected, retrying operation in 600ms... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        return this.executeWithRetry(fn, retries - 1);
      }
      throw err;
    }
  }

  /**
   * GET /api/applications
   * Retrieves all pipeline tracker items with metrics
   */
  async findAll(userId: string) {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        opportunity: {
          include: {
            employmentDetail: true,
            scholarshipDetail: true,
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    // Compute pipeline metrics
    const metrics = {
      total: applications.length,
      preparing: applications.filter(
        (a) => a.status === ApplicationStatus.PREPARING || a.status === ApplicationStatus.SAVED,
      ).length,
      applied: applications.filter((a) => a.status === ApplicationStatus.APPLIED).length,
      inProgress: applications.filter(
        (a) =>
          a.status === ApplicationStatus.SHORTLISTED ||
          a.status === ApplicationStatus.INTERVIEW,
      ).length,
      outcomes: applications.filter(
        (a) =>
          a.status === ApplicationStatus.OFFER_SUCCESSFUL ||
          a.status === ApplicationStatus.AWARDED ||
          a.status === ApplicationStatus.UNSUCCESSFUL ||
          a.status === ApplicationStatus.WITHDRAWN,
      ).length,
    };

    return {
      metrics,
      applications,
    };
  }

  /**
   * POST /api/applications
   * Creates or updates a tracked application
   */
  async createOrUpdate(userId: string, dto: CreateApplicationDto) {
    const opp = await this.resolveOpportunity(dto.opportunityId);
    const targetStatus = dto.status || ApplicationStatus.SAVED;

    try {
      const existing = await this.prisma.application.findUnique({
        where: {
          userId_opportunityId: {
            userId,
            opportunityId: opp.id,
          },
        },
      });

      if (existing) {
        return await this.prisma.application.update({
          where: { id: existing.id },
          data: {
            status: targetStatus,
            notes: dto.notes !== undefined ? dto.notes : existing.notes,
            appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : existing.appliedAt,
            statusHistory:
              existing.status !== targetStatus
                ? {
                    create: {
                      fromStatus: existing.status,
                      toStatus: targetStatus,
                      notes: dto.notes || `Stage updated to ${targetStatus}`,
                    },
                  }
                : undefined,
          },
          include: {
            opportunity: {
              include: {
                employmentDetail: true,
                scholarshipDetail: true,
              },
            },
            statusHistory: {
              orderBy: { changedAt: 'desc' },
            },
          },
        });
      }

      const created = await this.prisma.application.create({
        data: {
          userId,
          opportunityId: opp.id,
          status: targetStatus,
          notes: dto.notes,
          appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: targetStatus,
              notes: dto.notes || `Added to application tracker (${targetStatus})`,
            },
          },
        },
        include: {
          opportunity: {
            include: {
              employmentDetail: true,
              scholarshipDetail: true,
            },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
          },
        },
      });

      return created;
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Race condition recovery: record was created concurrently, update it safely
        return this.prisma.application.update({
          where: {
            userId_opportunityId: {
              userId,
              opportunityId: opp.id,
            },
          },
          data: {
            status: targetStatus,
            notes: dto.notes !== undefined ? dto.notes : undefined,
            appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
          },
          include: {
            opportunity: {
              include: {
                employmentDetail: true,
                scholarshipDetail: true,
              },
            },
            statusHistory: {
              orderBy: { changedAt: 'desc' },
            },
          },
        });
      }
      throw err;
    }
  }

  /**
   * PATCH /api/applications/:id/status
   * Transitions status and records history audit trail
   */
  async updateStatus(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const existing = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        userId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Application '${applicationId}' not found.`);
    }

    const isTerminalOutcome =
      dto.status === ApplicationStatus.OFFER_SUCCESSFUL ||
      dto.status === ApplicationStatus.AWARDED ||
      dto.status === ApplicationStatus.UNSUCCESSFUL ||
      dto.status === ApplicationStatus.WITHDRAWN;

    const updated = await this.executeWithRetry(async () => {
      return this.prisma.application.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          notes: dto.notes !== undefined ? dto.notes : existing.notes,
          appliedAt:
            dto.status === ApplicationStatus.APPLIED && !existing.appliedAt
              ? new Date()
              : dto.appliedAt
                ? new Date(dto.appliedAt)
                : existing.appliedAt,
          outcomeAt: isTerminalOutcome
            ? dto.outcomeAt
              ? new Date(dto.outcomeAt)
              : new Date()
            : existing.outcomeAt,
          statusHistory: {
            create: {
              fromStatus: existing.status,
              toStatus: dto.status,
              notes: dto.notes || `Status advanced to ${dto.status}`,
            },
          },
        },
        include: {
          opportunity: {
            include: {
              employmentDetail: true,
              scholarshipDetail: true,
            },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
          },
        },
      });
    });

    // Dispatch native push notification on milestone transitions
    if (
      dto.status === ApplicationStatus.SHORTLISTED ||
      dto.status === ApplicationStatus.INTERVIEW ||
      dto.status === ApplicationStatus.OFFER_SUCCESSFUL ||
      dto.status === ApplicationStatus.AWARDED
    ) {
      await this.pushService
        .sendNotification(userId, {
          title: '🎉 Application Progress',
          body: `Milestone reached! Your application for "${updated.opportunity?.title || 'opportunity'}" is now marked as ${dto.status.replace(/_/g, ' ')}.`,
          url: '/applications',
        })
        .catch(() => {});
    }

    return updated;
  }

  /**
   * PATCH /api/applications/:id/notes
   */
  async updateNotes(
    userId: string,
    applicationId: string,
    dto: UpdateApplicationNotesDto,
  ) {
    const existing = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Application '${applicationId}' not found.`);
    }

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { notes: dto.notes },
      include: {
        opportunity: true,
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });
  }

  /**
   * DELETE /api/applications/:id
   */
  async remove(userId: string, applicationId: string) {
    const existing = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Application '${applicationId}' not found.`);
    }

    await this.prisma.application.delete({
      where: { id: applicationId },
    });

    return {
      success: true,
      message: 'Application removed from tracker.',
    };
  }

  /**
   * Scheduled cron: Checks applications for opportunities closing in 7 days
   * Runs daily at 9:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkUpcomingDeadlines() {
    this.logger.log('Checking for upcoming application deadlines (7-day window)...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const applications = await this.prisma.application.findMany({
      where: {
        status: { in: [ApplicationStatus.SAVED, ApplicationStatus.PREPARING] },
        opportunity: {
          deadline: {
            gte: now,
            lte: sevenDaysFromNow,
          },
        },
      },
      include: {
        user: true,
        opportunity: true,
      },
    });

    for (const app of applications) {
      // Respect user's communication preferences
      const common = await this.prisma.commonProfile.findUnique({
        where: { userId: app.userId },
      });
      const prefs = (common?.interests as any)?.__preferences;
      if (prefs?.serviceReminders === false) {
        continue;
      }

      const deadlineStr = app.opportunity.deadline.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // 1. Transactional Email
      await this.mailService
        .sendDeadlineReminderEmail(
          app.user.email,
          app.user.firstName || 'Learner',
          app.opportunity.title,
          deadlineStr,
          app.opportunity.id,
        )
        .catch((err) => {
          this.logger.error(
            `Failed to send deadline reminder to ${app.user.email}: ${err.message}`,
          );
        });

      // 2. Native Push Notification
      await this.pushService
        .sendNotification(app.userId, {
          title: '⏰ Application Deadline Reminder',
          body: `${app.opportunity.title} closes on ${deadlineStr}. Submit your application before it closes!`,
          url: `/opportunities/${app.opportunity.id}`,
        })
        .catch(() => {});
    }

    this.logger.log(`Deadline check completed. Processed ${applications.length} opportunities.`);
  }

  /**
   * Scheduled cron: EM005 follow-up reminders for submitted applications (day 14 & day 28)
   * Stops on terminal outcomes (AWARDED, UNSUCCESSFUL, WITHDRAWN).
   * Runs daily at 9:30 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkApplicationFollowUps() {
    this.logger.log('Checking for EM005 application outcome follow-up reminders...');

    const now = new Date();
    // Non-terminal states: APPLIED, SHORTLISTED, INTERVIEW
    const activeApplied = await this.prisma.application.findMany({
      where: {
        status: { in: [ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW] },
        appliedAt: { not: null },
      },
      include: {
        user: true,
        opportunity: true,
      },
    });

    for (const app of activeApplied) {
      if (!app.appliedAt) continue;
      const daysSinceApplied = Math.floor(
        (now.getTime() - new Date(app.appliedAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      // Trigger on day 14 or day 28
      if (daysSinceApplied === 14 || daysSinceApplied === 28) {
        // Respect user's communication preferences
        const common = await this.prisma.commonProfile.findUnique({
          where: { userId: app.userId },
        });
        const prefs = (common?.interests as any)?.__preferences;
        if (prefs?.serviceReminders === false) {
          continue;
        }

        await this.mailService
          .sendApplicationFollowUpEmail(
            app.user.email,
            app.user.firstName || 'Learner',
            app.opportunity.title,
            app.id,
          )
          .catch((err) => {
            this.logger.error(`Failed to send EM005 follow-up to ${app.user.email}: ${err.message}`);
          });

        // Native Push Notification follow-up
        await this.pushService
          .sendNotification(app.userId, {
            title: '📋 Application Milestone Check-In',
            body: `Any update on ${app.opportunity.title}? Have you been shortlisted or invited for an interview?`,
            url: '/applications',
          })
          .catch(() => {});
      }
    }
  }
}
