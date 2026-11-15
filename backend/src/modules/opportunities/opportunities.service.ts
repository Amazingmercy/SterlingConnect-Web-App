import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { OpportunityQueryDto } from './dto/opportunity-query.dto';
import { OpportunityStatus, Pathway, NotificationType } from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  private readonly logger = new Logger(OpportunitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
  ) {}

  /**
   * Helper to retrieve full candidate profile for matching
   */
  private async getCandidateProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        commonProfile: true,
        employmentProfile: true,
        scholarshipProfile: true,
      },
    });
  }

  /**
   * GET /api/opportunities
   * Filterable public repository listing
   */
  async findAll(query: OpportunityQueryDto, userId?: string) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: OpportunityStatus.PUBLISHED,
    };

    if (query.type) {
      where.opportunityType = query.type;
    }

    if (query.country) {
      where.country = { contains: query.country };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { organization: { contains: query.search } },
        { overview: { contains: query.search } },
        { location: { contains: query.search } },
      ];
    }

    if (query.workArrangement) {
      where.employmentDetail = {
        workArrangement: query.workArrangement,
      };
    }

    if (query.sector) {
      where.employmentDetail = {
        ...where.employmentDetail,
        sector: { contains: query.sector },
      };
    }

    const [total, items] = await Promise.all([
      this.prisma.opportunity.count({ where }),
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isFeatured: 'desc' }, { deadline: 'asc' }],
        include: {
          employmentDetail: true,
          scholarshipDetail: true,
          ...(userId ? { savedByUsers: { where: { userId } } } : {}),
        },
      }),
    ]);

    let candidateProfile: any = null;
    if (userId) {
      candidateProfile = await this.getCandidateProfile(userId);
    }

    const opportunities = items.map((item) => {
      const isSaved = userId ? (item.savedByUsers?.length || 0) > 0 : false;
      const matchEvaluation = this.matchingService.evaluateOpportunityMatch(
        item,
        candidateProfile,
      );

      return {
        ...item,
        isSaved,
        savedByUsers: undefined,
        matchEvaluation,
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      opportunities,
    };
  }

  /**
   * GET /api/opportunities/matched
   * Pathway-aligned & rules-based matched opportunities
   */
  async findMatched(userId: string) {
    const candidateProfile = await this.getCandidateProfile(userId);
    if (!candidateProfile) {
      throw new NotFoundException('User profile not found.');
    }

    // Determine target opportunity type from user's active pathway
    const where: any = {
      status: OpportunityStatus.PUBLISHED,
    };

    if (candidateProfile.activePathway === Pathway.EMPLOYMENT) {
      where.opportunityType = 'EMPLOYMENT';
    } else if (candidateProfile.activePathway === Pathway.SCHOLARSHIP) {
      where.opportunityType = 'SCHOLARSHIP';
    }

    const items = await this.prisma.opportunity.findMany({
      where,
      include: {
        employmentDetail: true,
        scholarshipDetail: true,
        savedByUsers: { where: { userId } },
      },
    });

    // Evaluate each opportunity with transparent rules engine
    const evaluated = items.map((item) => {
      const isSaved = (item.savedByUsers?.length || 0) > 0;
      const matchEvaluation = this.matchingService.evaluateOpportunityMatch(
        item,
        candidateProfile,
      );

      return {
        ...item,
        isSaved,
        savedByUsers: undefined,
        matchEvaluation,
      };
    });

    // Sort order:
    // 1. Eligible first (gatePassed)
    // 2. fitScore DESC
    // 3. deadline ASC
    evaluated.sort((a, b) => {
      if (a.matchEvaluation.isEligible !== b.matchEvaluation.isEligible) {
        return a.matchEvaluation.isEligible ? -1 : 1;
      }
      if (b.matchEvaluation.fitScore !== a.matchEvaluation.fitScore) {
        return b.matchEvaluation.fitScore - a.matchEvaluation.fitScore;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return {
      activePathway: candidateProfile.activePathway,
      totalMatched: evaluated.length,
      opportunities: evaluated,
    };
  }

  /**
   * GET /api/opportunities/:id
   * Single opportunity details with match evaluation
   */
  async findById(idOrCode: string, userId?: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        OR: [{ id: idOrCode }, { referenceCode: idOrCode }],
      },
      include: {
        employmentDetail: true,
        scholarshipDetail: true,
        ...(userId ? { savedByUsers: { where: { userId } } } : {}),
      },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity '${idOrCode}' not found.`);
    }

    let matchEvaluation = null;
    let isSaved = false;

    if (userId) {
      const candidateProfile = await this.getCandidateProfile(userId);
      matchEvaluation = this.matchingService.evaluateOpportunityMatch(
        opportunity,
        candidateProfile,
      );
      isSaved = (opportunity.savedByUsers?.length || 0) > 0;
    }

    return {
      ...opportunity,
      isSaved,
      savedByUsers: undefined,
      matchEvaluation,
    };
  }

  /**
   * POST /api/opportunities/:id/save
   * Toggles saved opportunity state for current user
   */
  async toggleSave(userId: string, opportunityId: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        OR: [{ id: opportunityId }, { referenceCode: opportunityId }],
      },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity not found.`);
    }

    const existing = await this.prisma.savedOpportunity.findFirst({
      where: {
        userId,
        opportunityId: opportunity.id,
      },
    });

    if (existing) {
      // U19: Remove bookmark; keep application
      await this.prisma.savedOpportunity.delete({
        where: { id: existing.id },
      });

      return {
        saved: false,
        opportunityId: opportunity.id,
        message: 'Opportunity removed from your saved list.',
      };
    }

    await this.prisma.savedOpportunity.create({
      data: {
        userId,
        opportunityId: opportunity.id,
      },
    });

    // Create deadline alert notification (Workbook U24 copy: "{opportunity_title} closes on {deadline_display}.")
    if (opportunity.deadline) {
      const deadlineDate = new Date(opportunity.deadline);
      const deadlineDisplay = deadlineDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      await this.prisma.notification
        .create({
          data: {
            userId,
            title: 'Saved deadline alert',
            message: `${opportunity.title} closes on ${deadlineDisplay}.`,
            type: NotificationType.DEADLINE_REMINDER,
            actionUrl: `/opportunities/${opportunity.id}`,
            isRead: false,
          },
        })
        .catch((err) => {
          this.logger.warn(`Failed to create saved deadline notification: ${err.message}`);
        });
    }

    return {
      saved: true,
      opportunityId: opportunity.id,
      message: 'Opportunity saved to your saved list.',
    };
  }

  /**
   * GET /api/opportunities/saved
   * Retrieves all opportunities bookmarked by the user
   */
  async getSavedOpportunities(userId: string) {
    const candidateProfile = await this.getCandidateProfile(userId);

    const saved = await this.prisma.savedOpportunity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        opportunity: {
          include: {
            employmentDetail: true,
            scholarshipDetail: true,
          },
        },
      },
    });

    const items = saved.map((s) => {
      const matchEvaluation = this.matchingService.evaluateOpportunityMatch(
        s.opportunity,
        candidateProfile,
      );

      return {
        savedAt: s.createdAt,
        ...s.opportunity,
        isSaved: true,
        matchEvaluation,
      };
    });

    return {
      totalSaved: items.length,
      opportunities: items,
    };
  }
}
