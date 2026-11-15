import { Module } from '@nestjs/common';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { MatchingModule } from '../matching/matching.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [MatchingModule, JwtModule.register({})],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
