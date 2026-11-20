import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('push-notifications')
export class PushNotificationsController {
  constructor(private readonly pushService: PushNotificationsService) {}

  @Get('public-key')
  getPublicKey() {
    return {
      publicKey: this.pushService.getPublicKey(),
    };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body('subscription') subscription: any,
  ) {
    return this.pushService.saveSubscription(userId, subscription);
  }

  @Post('test')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendTestPush(@CurrentUser('id') userId: string) {
    return this.pushService.sendNotification(userId, {
      title: 'Sterling Connect Notification',
      body: 'PWA Web Push is working! You will receive reminders for opportunity deadlines and application milestones.',
      url: '/applications',
    });
  }
}
