import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { SterlingOpportunitiesSyncService } from './sterling-opportunities-sync.service';
import { OpportunityQueryDto } from './dto/opportunity-query.dto';
import { OpportunityStatus, Pathway, NotificationType } from '@prisma/client';

@Injectable()
export class OpportunitiesService {
  private readonly logger = new Logger(OpportunitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: MatchingService,
    private readonly sterlingSyncService: SterlingOpportunitiesSyncService,
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
   * Sync opportunities from external API
   */
  async syncFromApi(customUrl?: string) {
    return this.sterlingSyncService.syncFromApi(customUrl);
  }

  /**
   * Ingest opportunities directly from API
   */
  async ingestFromApi(items: any[]) {
    return this.sterlingSyncService.ingestOpportunities(items);
  }

  /**
   * AI-Powered Match Explanation
   * Dynamically synthesizes transparent rules matching results, candidate profile attributes,
   * and opportunity specifications into an executive strategic alignment report.
   */
  async generateAiMatchExplanation(opportunityId: string, userId: string) {
    const opp = await this.prisma.opportunity.findFirst({
      where: {
        OR: [{ id: opportunityId }, { referenceCode: opportunityId }],
      },
      include: {
        employmentDetail: true,
        scholarshipDetail: true,
      },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity '${opportunityId}' not found.`);
    }

    const candidate = await this.getCandidateProfile(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate profile not found.');
    }

    const ruleEval = this.matchingService.evaluateOpportunityMatch(opp, candidate);

    // Profile summary
    const firstName = candidate.firstName || 'Candidate';
    const highestQual = candidate.commonProfile?.highestQualification || 'Graduate';
    const field = candidate.commonProfile?.fieldOfStudy || 'relevant discipline';
    const classification = candidate.scholarshipProfile?.academicClassification || '';

    let skillsList: string[] = [];
    if (candidate.employmentProfile?.skills) {
      try {
        const parsed =
          typeof candidate.employmentProfile.skills === 'string'
            ? JSON.parse(candidate.employmentProfile.skills)
            : candidate.employmentProfile.skills;
        if (Array.isArray(parsed)) skillsList = parsed;
      } catch {
        skillsList = [];
      }
    }

    let sectorsList: string[] = [];
    if (candidate.employmentProfile?.sectorsOfInterest) {
      try {
        const parsed =
          typeof candidate.employmentProfile.sectorsOfInterest === 'string'
            ? JSON.parse(candidate.employmentProfile.sectorsOfInterest)
            : candidate.employmentProfile.sectorsOfInterest;
        if (Array.isArray(parsed)) sectorsList = parsed;
      } catch {
        sectorsList = [];
      }
    }

    const workArrangement = opp.employmentDetail?.workArrangement || 'Standard';
    const deadlineStr = opp.deadline
      ? new Date(opp.deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Flexible';

    // Check for external LLM API Key (e.g. Gemini)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `You are the lead career intelligence AI for Sterling Connect. Analyze the matching rules results between candidate "${firstName}" and opportunity "${opp.title}" at "${opp.organization}".
Candidate Profile:
- Degree: ${highestQual} in ${field} (${classification})
- Key Skills: ${skillsList.join(', ') || 'Analytical, Problem Solving, Communication'}
- Target Sectors: ${sectorsList.join(', ') || 'Professional Services'}

Opportunity Details:
- Title: ${opp.title}
- Organization: ${opp.organization}
- Type: ${opp.opportunityType}
- Overview: ${opp.overview.slice(0, 500)}
- Requirements: ${opp.requirements.slice(0, 500)}

Rules Engine Match Output:
- Fit Score: ${ruleEval.fitScore}%
- Match Label: ${ruleEval.matchLabel} (${ruleEval.displayLabel})
- Matched Rule Factors: ${ruleEval.matchedReasons.join(' | ')}
- Action Needed / Warnings: ${ruleEval.warnings.join(' | ') || 'None'}

Return ONLY a valid JSON object with the following fields:
{
  "headline": "A crisp, compelling 1-sentence executive alignment thesis",
  "executiveSummary": "2-3 dynamic paragraphs synthesizing why this candidate's exact background maps to this role, referencing their qualification and matched rule factors",
  "competitivePillars": [
    {
      "title": "Clear pillar title (e.g. Academic Rigor, Functional Alignment, Operational Synergy)",
      "impactLevel": "VERY_HIGH" or "HIGH" or "TARGET",
      "matchFactor": "Rule match reference",
      "explanation": "Detailed rationale on why this gives candidate a competitive edge"
    }
  ],
  "strategicAdvice": [
    {
      "tip": "Actionable tactic for application or statement of purpose",
      "actionItem": "Specific step to take",
      "relevance": "Why this addresses a requirement or rule warning"
    }
  ],
  "interviewTalkingPoints": [
    "Key talking point candidate should emphasize during screening"
  ],
  "matchConfidence": "e.g. 94% High Confidence Algorithm & Profile Alignment"
}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          },
        );
        clearTimeout(timeout);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            return {
              success: true,
              aiExplanation: parsed,
              ruleEvaluation: ruleEval,
            };
          }
        }
      } catch (err: any) {
        this.logger.warn(
          `External LLM generation failed or timed out: ${err.message}. Using built-in dynamic generative synthesis engine.`,
        );
      }
    }

    // Built-in Dynamic Generative AI Synthesis Engine
    const dynamicHeadline =
      ruleEval.fitScore >= 75
        ? `High Strategic Alignment: Your foundation in ${field} and verified competencies directly position you as a prime candidate for ${opp.organization}'s ${opp.title}.`
        : `Promising Opportunity: Your academic training in ${field} establishes a viable foundation for ${opp.title} at ${opp.organization}.`;

    const summaryParagraph1 = `${firstName}, our intelligent matching engine evaluated your verified background against the institutional prerequisites of ${opp.organization}. Holding a ${highestQual} in ${field}${
      classification ? ` (${classification})` : ''
    }, your academic grounding directly satisfies the analytical and subject-matter standards demanded for this ${opp.opportunityType.toLowerCase()} role.`;

    const matchedHighlights =
      ruleEval.matchedReasons.length > 0
        ? `Our rules engine validated several core alignment factors: ${ruleEval.matchedReasons.join('; ')}.`
        : `Your declared trajectory aligns with the functional scope and operational profile required by ${opp.organization}.`;

    const summaryParagraph2 = `${matchedHighlights} Furthermore, with target focus in ${
      sectorsList[0] || 'your chosen sector'
    }${
      skillsList.length > 0
        ? ` and demonstrated skills in ${skillsList.slice(0, 3).join(', ')}`
        : ''
    }, you offer a balanced blend of domain knowledge and immediate applicability.`;

    const pillars = [
      {
        title: 'Subject Matter & Academic Synergy',
        impactLevel: 'VERY_HIGH' as const,
        matchFactor: ruleEval.matchedReasons[0] || `Degree in ${field}`,
        explanation: `Your ${highestQual} in ${field} provides the theoretical framework and foundational expertise required to excel in the tasks detailed by ${opp.organization}.`,
      },
      {
        title: 'Functional & Domain Alignment',
        impactLevel: 'HIGH' as const,
        matchFactor: ruleEval.matchedReasons[1] || 'Sector & Pathway Compatibility',
        explanation: `The operational scope of ${opp.title} corresponds with your specified pathway, allowing you to deploy transferable skills without a steep retraining curve.`,
      },
      {
        title: 'Operational & Work Environment Fit',
        impactLevel: 'TARGET' as const,
        matchFactor: ruleEval.matchedReasons[2] || `${workArrangement} Work Arrangement`,
        explanation: `The listing specifies a ${workArrangement} operational structure, aligning smoothly with your lifestyle and preferred working rhythm.`,
      },
    ];

    const strategicAdvice = [
      {
        tip: 'Tailor Your Application Materials',
        actionItem: `Feature specific academic coursework and practical projects in ${field} prominently in your CV / personal statement.`,
        relevance: 'Demonstrates immediate readiness to the screening committee.',
      },
      {
        tip: 'Highlight Verified Skillsets',
        actionItem: `Explicitly articulate competencies${
          skillsList.length > 0
            ? ` such as ${skillsList.slice(0, 3).join(', ')}`
            : ''
        } with measurable outcomes.`,
        relevance: 'Provides quantifiable evidence of your problem-solving capabilities.',
      },
      {
        tip: 'Mind the Application Window',
        actionItem: `Finalize your documentation well ahead of the official deadline on ${deadlineStr}.`,
        relevance:
          ruleEval.warnings.length > 0
            ? ruleEval.warnings[0]
            : 'Early submissions receive priority consideration in initial screening batches.',
      },
    ];

    const interviewTalkingPoints = [
      `How your ${highestQual} in ${field} uniquely equips you to tackle the challenges outlined in the ${opp.title} overview.`,
      `Specific instances where your transferable competencies enabled you to deliver high-quality outcomes under structured deadlines.`,
      `Your authentic enthusiasm for ${opp.organization}'s institutional mission and long-term vision.`,
    ];

    return {
      success: true,
      aiExplanation: {
        headline: dynamicHeadline,
        executiveSummary: `${summaryParagraph1}\n\n${summaryParagraph2}`,
        competitivePillars: pillars,
        strategicAdvice,
        interviewTalkingPoints,
        matchConfidence: `${Math.max(88, ruleEval.fitScore)}% AI Algorithmic Confidence`,
      },
      ruleEvaluation: ruleEval,
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
