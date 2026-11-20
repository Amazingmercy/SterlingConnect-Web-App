import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PublicSettingsController } from './public-settings.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';

@Module({
  imports: [PrismaModule, RecommendationsModule, OpportunitiesModule],
  controllers: [AdminController, PublicSettingsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
