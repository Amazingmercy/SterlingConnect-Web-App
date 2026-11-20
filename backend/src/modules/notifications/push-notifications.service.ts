import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as webpush from 'web-push';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class PushNotificationsService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationsService.name);
  private vapidPublicKey = '';
  private vapidPrivateKey = '';

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.initVapidKeys();
  }

  /**
   * Initialize or automatically generate self-hosted VAPID Keys
   * (Zero external platform / SaaS required)
   */
  private async initVapidKeys() {
    // 1. Check environment variables
    const envPublic = process.env.VAPID_PUBLIC_KEY;
    const envPrivate = process.env.VAPID_PRIVATE_KEY;

    if (envPublic && envPrivate) {
      this.vapidPublicKey = envPublic.trim();
      this.vapidPrivateKey = envPrivate.trim();
    } else {
      // 2. Check database SystemSetting
      try {
        const savedKeys = await this.prisma.systemSetting.findUnique({
          where: { key: 'vapidKeys' },
        });

        if (savedKeys) {
          const parsed = JSON.parse(savedKeys.value);
          this.vapidPublicKey = parsed.publicKey;
          this.vapidPrivateKey = parsed.privateKey;
        } else {
          // 3. Generate fresh pair and persist in database
          const keys = webpush.generateVAPIDKeys();
          this.vapidPublicKey = keys.publicKey;
          this.vapidPrivateKey = keys.privateKey;

          await this.prisma.systemSetting.create({
            data: {
              key: 'vapidKeys',
              value: JSON.stringify(keys),
              category: 'INTEGRATIONS',
              isSecret: true,
            },
          });
          this.logger.log('Generated and stored fresh self-hosted VAPID keys.');
        }
      } catch (err: any) {
        this.logger.warn(`Failed to access database for VAPID keys: ${err.message}. Generating in-memory keys.`);
        const keys = webpush.generateVAPIDKeys();
        this.vapidPublicKey = keys.publicKey;
        this.vapidPrivateKey = keys.privateKey;
      }
    }

    try {
      webpush.setVapidDetails(
        'mailto:support@sterlingconnect.org',
        this.vapidPublicKey,
        this.vapidPrivateKey,
      );
      this.logger.log('Native Web Push Protocol initialized successfully.');
    } catch (err: any) {
      this.logger.error(`Error setting VAPID details: ${err.message}`);
    }
  }

  /**
   * Return Public VAPID key to browser client
   */
  getPublicKey(): string {
    return this.vapidPublicKey;
  }

  /**
   * Register browser push subscription for a user
   */
  async saveSubscription(userId: string, subscription: PushSubscriptionPayload) {
    if (!subscription || !subscription.endpoint) return;

    const settingKey = `push_sub_${userId}`;
    const serialized = JSON.stringify(subscription);

    try {
      await this.prisma.systemSetting.upsert({
        where: { key: settingKey },
        update: {
          value: serialized,
          category: 'PUSH_SUBSCRIPTIONS',
          updatedAt: new Date(),
        },
        create: {
          key: settingKey,
          value: serialized,
          category: 'PUSH_SUBSCRIPTIONS',
          isSecret: false,
        },
      });

      this.logger.log(`Saved push subscription for user ${userId}`);
      return { success: true, message: 'Push subscription registered.' };
    } catch (err: any) {
      this.logger.error(`Failed to save push subscription: ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  /**
   * Send native push notification directly to user's browser / PWA
   */
  async sendNotification(
    userId: string,
    payload: { title: string; body: string; url?: string },
  ) {
    const settingKey = `push_sub_${userId}`;

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: settingKey },
      });

      if (!setting) {
        return { success: false, message: 'No push subscription found for user.' };
      }

      const subscription: PushSubscriptionPayload = JSON.parse(setting.value);
      const pushPayload = JSON.stringify({
        title: payload.title || 'Sterling Connect Alert',
        body: payload.body,
        url: payload.url || '/applications',
        icon: '/pwa-192x192.png',
      });

      await webpush.sendNotification(subscription as any, pushPayload);
      this.logger.log(`Push notification delivered to user ${userId}: "${payload.title}"`);
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`Failed to deliver push notification: ${err.message}`);
      // If subscription expired or unsubscribed (410 / 404), purge it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await this.prisma.systemSetting.delete({ where: { key: settingKey } }).catch(() => {});
      }
      return { success: false, error: err.message };
    }
  }
}
