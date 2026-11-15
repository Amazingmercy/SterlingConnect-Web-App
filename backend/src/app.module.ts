import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ReadinessModule } from './modules/readiness/readiness.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { AdminModule } from './modules/admin/admin.module';
import { MailModule } from './modules/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TaxonomiesModule } from './modules/taxonomies/taxonomies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ReadinessModule,
    OpportunitiesModule,
    MatchingModule,
    ApplicationsModule,
    RecommendationsModule,
    AdminModule,
    MailModule,
    NotificationsModule,
    TaxonomiesModule,
  ],
})
export class AppModule {}
