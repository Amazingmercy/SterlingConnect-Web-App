import { Controller, Get, Query, Req } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to extract optional candidate user ID from token
   */
  private extractUserId(req: Request): string | undefined {
    try {
      const token =
        req.cookies?.['access_token'] ||
        req.headers.authorization?.replace('Bearer ', '');
      if (!token) return undefined;

      const secret = this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'sterling_connect_jwt_access_secret_super_secure_key_change_in_prod',
      );
      const decoded: any = this.jwtService.verify(token, { secret });
      return decoded?.sub;
    } catch {
      return undefined;
    }
  }

  /**
   * GET /api/recommendations
   * Candidate recommendations based on diagnostic gap priority & active pathway
   */
  @Get()
  async getRecommendations(
    @Query() query: RecommendationQueryDto,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.recommendationsService.getRecommendationsForCandidate(
      userId,
      query,
    );
  }

  /**
   * GET /api/recommendations/courses
   * Full Sterling Academy course directory
   */
  @Get('courses')
  async getAllCourses(@Query() query: RecommendationQueryDto) {
    return this.recommendationsService.getAllCourses(query);
  }

  /**
   * GET /api/recommendations/categories
   * Diagnostic 10-dimension categories
   */
  @Get('categories')
  async getCategories() {
    return this.recommendationsService.getCategories();
  }
}
