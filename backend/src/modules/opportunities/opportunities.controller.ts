import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { OpportunityQueryDto } from './dto/opportunity-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly opportunitiesService: OpportunitiesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Helper to extract user ID from JWT cookie/header without throwing 401
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
   * Public listing with optional user context for matching & saved indicators
   */
  @Get()
  async getOpportunities(
    @Query() query: OpportunityQueryDto,
    @Req() req: Request,
  ) {
    const userId = this.extractUserId(req);
    return this.opportunitiesService.findAll(query, userId);
  }

  /**
   * Matched opportunities based on user pathway and profile
   */
  @Get('matched')
  @UseGuards(JwtAuthGuard)
  async getMatchedOpportunities(@CurrentUser('id') userId: string) {
    return this.opportunitiesService.findMatched(userId);
  }

  /**
   * Personalised / For-You feed alias
   */
  @Get('for-you')
  @UseGuards(JwtAuthGuard)
  async getForYouOpportunities(@CurrentUser('id') userId: string) {
    return this.opportunitiesService.findMatched(userId);
  }

  /**
   * User bookmarked / saved opportunities
   */
  @Get('saved')
  @UseGuards(JwtAuthGuard)
  async getSavedOpportunities(@CurrentUser('id') userId: string) {
    return this.opportunitiesService.getSavedOpportunities(userId);
  }

  /**
   * Single opportunity details
   */
  @Get(':id')
  async getOpportunityById(@Param('id') id: string, @Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.opportunitiesService.findById(id, userId);
  }

  /**
   * Toggle bookmark/save opportunity
   */
  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleSaveOpportunity(
    @CurrentUser('id') userId: string,
    @Param('id') opportunityId: string,
  ) {
    return this.opportunitiesService.toggleSave(userId, opportunityId);
  }
}
