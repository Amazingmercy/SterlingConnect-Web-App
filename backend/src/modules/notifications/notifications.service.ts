import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/notifications
   * Returns user's in-app notifications directly from the database.
   * If user has 0 notifications, automatically seeds contextual notifications per Screen U24.
   */
  async findAll(userId: string) {
    const existingCount = await this.prisma.notification.count({ where: { userId } });

    if (existingCount === 0) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          savedOpportunities: { include: { opportunity: true }, take: 1 },
          applications: { include: { opportunity: true }, take: 1 },
        },
      });

      if (user) {
        const toCreate: Array<{
          title: string;
          message: string;
          type: NotificationType;
          actionUrl?: string;
        }> = [];

        // 1. Saved opportunity or top featured deadline alert
        if (user.savedOpportunities && user.savedOpportunities.length > 0) {
          const opp = user.savedOpportunities[0].opportunity;
          const deadlineDisplay = opp.deadline
            ? new Date(opp.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '30 Nov 2026';
          toCreate.push({
            title: 'Saved deadline alert',
            message: `${opp.title} closes on ${deadlineDisplay}.`,
            type: NotificationType.DEADLINE_REMINDER,
            actionUrl: `/opportunities/${opp.id}`,
          });
        } else {
          const featured = await this.prisma.opportunity.findFirst({
            where: { status: 'PUBLISHED' },
            orderBy: { deadline: 'asc' },
          });
          if (featured) {
            const deadlineDisplay = featured.deadline
              ? new Date(featured.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : '30 Nov 2026';
            toCreate.push({
              title: 'Saved deadline alert',
              message: `${featured.title} closes on ${deadlineDisplay}.`,
              type: NotificationType.DEADLINE_REMINDER,
              actionUrl: `/opportunities/${featured.id}`,
            });
          }
        }

        // 2. Assessment result notification
        const pathwayDisplayName =
          user.activePathway === 'SCHOLARSHIP' ? 'scholarship readiness' : 'career readiness';

        if (user.hasCompletedAssessment) {
          toCreate.push({
            title: 'Completed attempt',
            message: `Your ${pathwayDisplayName} results are ready.`,
            type: NotificationType.ASSESSMENT_RESULT,
            actionUrl: '/assessment/results',
          });
        } else {
          toCreate.push({
            title: 'Readiness check',
            message: `Complete your ${pathwayDisplayName} diagnostic to discover your match ranking.`,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            actionUrl: '/assessment',
          });
        }

        // 3. Application follow-up notification
        if (user.applications && user.applications.length > 0) {
          const app = user.applications[0];
          toCreate.push({
            title: 'Eligible application follow-up',
            message: `Any update on ${app.opportunity.title}?`,
            type: NotificationType.STATUS_UPDATE,
            actionUrl: '/applications',
          });
        }

        for (const item of toCreate) {
          await this.prisma.notification.create({
            data: {
              userId,
              title: item.title,
              message: item.message,
              type: item.type,
              actionUrl: item.actionUrl,
              isRead: false,
            },
          });
        }
      }
    }

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      unreadCount,
      notifications,
    };
  }

  /**
   * Helper to create in-app notification
   */
  async createNotification(userId: string, data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.DEADLINE_REMINDER,
        actionUrl: data.actionUrl,
      },
    });
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found.');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: 'All notifications marked as read.' };
  }

  /**
   * DELETE /api/notifications/:id
   */
  async remove(userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notif) {
      throw new NotFoundException('Notification not found.');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    return { success: true, message: 'Notification deleted.' };
  }
}
