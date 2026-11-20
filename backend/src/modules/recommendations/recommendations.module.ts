import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { SterlingCoursesService } from './sterling-courses.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule.register({})],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, SterlingCoursesService],
  exports: [RecommendationsService, SterlingCoursesService],
})
export class RecommendationsModule {}
