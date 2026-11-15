import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { SaveDraftDto, SubmitAssessmentDto } from './dto/assessment.dto';
import { ReadinessBand, AssessmentAttemptStatus, NotificationType } from '@prisma/client';

@Injectable()
export class ReadinessService {
  private readonly logger = new Logger(ReadinessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /**
   * Helper to get the active published assessment version
   */
  private async getActiveVersion() {
    let version = await this.prisma.assessmentVersion.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!version) {
      // Fallback to latest version
      version = await this.prisma.assessmentVersion.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!version) {
      throw new NotFoundException('No active readiness assessment version found.');
    }

    return version;
  }

  /**
   * Determine Readiness Band based on 0-100 score
   */
  private getBand(score: number): ReadinessBand {
    if (score < 25) return ReadinessBand.EMERGING;
    if (score < 50) return ReadinessBand.FOUNDATIONAL;
    if (score < 75) return ReadinessBand.DEVELOPING;
    return ReadinessBand.PROFICIENT;
  }

  /**
   * GET /api/assessment/questions
   * Returns all 50 questions with any saved draft responses for the user
   */
  async getQuestions(userId: string) {
    const version = await this.getActiveVersion();

    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { versionId: version.id, isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            displayOrder: true,
          },
        },
      },
    });

    // Check if user has an existing draft attempt
    const draftAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        userId,
        versionId: version.id,
        status: AssessmentAttemptStatus.DRAFT,
      },
      include: {
        responses: {
          include: {
            question: {
              select: { questionCode: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const draftResponses: Record<string, number> = {};
    if (draftAttempt) {
      for (const r of draftAttempt.responses) {
        draftResponses[r.question.questionCode] = r.response;
      }
    }

    // Check if user already completed the assessment
    const completedAttempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        userId,
        status: AssessmentAttemptStatus.COMPLETED,
        isLatest: true,
      },
    });

    return {
      version: {
        id: version.id,
        versionNumber: version.versionNumber,
        title: version.title,
      },
      totalQuestions: questions.length,
      answeredCount: Object.keys(draftResponses).length,
      isCompleted: !!completedAttempt,
      draftResponses,
      questions: questions.map((q) => ({
        id: q.id,
        code: q.questionCode,
        categoryId: q.categoryId,
        categoryName: q.categoryName,
        orderIndex: q.orderIndex,
        orderInCategory: q.orderInCategory,
        statement: q.statement,
        construct: q.construct,
      })),
    };
  }

  /**
   * POST /api/assessment/save-draft
   * Saves partial progress without locking or scoring
   */
  async saveDraft(userId: string, dto: SaveDraftDto) {
    const version = await this.getActiveVersion();

    // Find or create active draft attempt
    let attempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        userId,
        versionId: version.id,
        status: AssessmentAttemptStatus.DRAFT,
      },
    });

    if (!attempt) {
      attempt = await this.prisma.assessmentAttempt.create({
        data: {
          userId,
          versionId: version.id,
          status: AssessmentAttemptStatus.DRAFT,
          isLatest: false,
        },
      });
    }

    // Fetch questions to map questionCode -> questionId
    const questionCodes = dto.responses.map((r) => r.questionCode);
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: {
        versionId: version.id,
        questionCode: { in: questionCodes },
      },
      select: { id: true, questionCode: true },
    });

    const questionMap = new Map(questions.map((q) => [q.questionCode, q.id]));
    const validResponses = dto.responses
      .filter((r) => questionMap.has(r.questionCode))
      .map((r) => ({
        attemptId: attempt.id,
        questionId: questionMap.get(r.questionCode)!,
        response: r.response,
      }));

    if (validResponses.length > 0) {
      const questionIdsToUpdate = validResponses.map((v) => v.questionId);
      // Fast atomic batch upsert: remove existing touched questions and bulk insert
      await this.prisma.$transaction([
        this.prisma.assessmentResponse.deleteMany({
          where: {
            attemptId: attempt.id,
            questionId: { in: questionIdsToUpdate },
          },
        }),
        this.prisma.assessmentResponse.createMany({
          data: validResponses,
        }),
      ]);
    }

    const currentCount = await this.prisma.assessmentResponse.count({
      where: { attemptId: attempt.id },
    });

    return {
      success: true,
      attemptId: attempt.id,
      answeredCount: currentCount,
      totalQuestions: 50,
      message: `Draft saved successfully (${currentCount}/50 answered).`,
    };
  }

  /**
   * POST /api/assessment/submit
   * Atomically computes category scores, deterministic priority rankings,
   * unlocks dashboard, and sends completion email.
   */
  async submitAssessment(userId: string, dto: SubmitAssessmentDto) {
    const version = await this.getActiveVersion();

    // Verify all 50 questions
    const allQuestions = await this.prisma.assessmentQuestion.findMany({
      where: { versionId: version.id, isActive: true },
      include: { category: true },
    });

    if (allQuestions.length !== 50) {
      throw new BadRequestException(
        `Expected 50 diagnostic questions in version, found ${allQuestions.length}.`,
      );
    }

    // Build question map
    const questionByCode = new Map(allQuestions.map((q) => [q.questionCode, q]));

    // Check responses in DTO or combine with saved draft responses
    const responsesMap = new Map<string, number>();
    for (const r of dto.responses) {
      if (r.response < 1 || r.response > 5) {
        throw new BadRequestException(
          `Invalid response for ${r.questionCode}: must be between 1 and 5.`,
        );
      }
      responsesMap.set(r.questionCode, r.response);
    }

    // If DTO doesn't have all 50, check if existing draft has the rest
    if (responsesMap.size < 50) {
      const existingDraft = await this.prisma.assessmentAttempt.findFirst({
        where: {
          userId,
          versionId: version.id,
          status: AssessmentAttemptStatus.DRAFT,
        },
        include: {
          responses: {
            include: { question: true },
          },
        },
      });

      if (existingDraft) {
        for (const resp of existingDraft.responses) {
          if (!responsesMap.has(resp.question.questionCode)) {
            responsesMap.set(resp.question.questionCode, resp.response);
          }
        }
      }
    }

    if (responsesMap.size !== 50) {
      throw new BadRequestException(
        `All 50 questions must be answered to submit. Answered: ${responsesMap.size}/50.`,
      );
    }

    // Group responses by category
    const categoryAnswers = new Map<
      string,
      { categoryName: string; responses: number[] }
    >();

    for (const q of allQuestions) {
      const score = responsesMap.get(q.questionCode);
      if (score === undefined) {
        throw new BadRequestException(`Missing response for question ${q.questionCode}`);
      }

      if (!categoryAnswers.has(q.categoryId)) {
        categoryAnswers.set(q.categoryId, {
          categoryName: q.categoryName,
          responses: [],
        });
      }
      categoryAnswers.get(q.categoryId)!.responses.push(score);
    }

    // 1. Calculate rawTotal, scorePercent, lowResponseCount for each of the 10 categories
    const categoryCalculations: Array<{
      categoryId: string;
      categoryName: string;
      rawTotal: number;
      scorePercent: number;
      readinessBand: ReadinessBand;
      lowResponseCount: number;
      priorityRank: number;
      isTopPriority: boolean;
    }> = [];

    for (const [catId, data] of categoryAnswers.entries()) {
      if (data.responses.length !== 5) {
        throw new BadRequestException(
          `Category ${catId} must have exactly 5 answers, found ${data.responses.length}.`,
        );
      }

      const rawTotal = data.responses.reduce((sum, val) => sum + val, 0);
      // Formula: ((rawTotal - 5) / 20) * 100
      const scorePercent = Number((((rawTotal - 5) / 20) * 100).toFixed(1));
      const readinessBand = this.getBand(scorePercent);
      const lowResponseCount = data.responses.filter((r) => r <= 2).length;

      categoryCalculations.push({
        categoryId: catId,
        categoryName: data.categoryName,
        rawTotal,
        scorePercent,
        readinessBand,
        lowResponseCount,
        priorityRank: 0, // Assigned below
        isTopPriority: false,
      });
    }

    // 2. Deterministic 3-tier tie-breaking:
    // 1st: scorePercent ASC (lowest score first)
    // 2nd: lowResponseCount DESC (more answers <= 2 first)
    // 3rd: categoryId ASC (alphabetical: CAT-01, CAT-02, etc.)
    categoryCalculations.sort((a, b) => {
      if (a.scorePercent !== b.scorePercent) {
        return a.scorePercent - b.scorePercent;
      }
      if (b.lowResponseCount !== a.lowResponseCount) {
        return b.lowResponseCount - a.lowResponseCount;
      }
      return a.categoryId.localeCompare(b.categoryId);
    });

    // Assign ranks 1..10 and top 3 flag
    categoryCalculations.forEach((cat, index) => {
      cat.priorityRank = index + 1;
      cat.isTopPriority = index < 3;
    });

    // Overall score = average of 10 category scores
    const overallScore = Number(
      (
        categoryCalculations.reduce((sum, c) => sum + c.scorePercent, 0) /
        categoryCalculations.length
      ).toFixed(1),
    );
    const overallBand = this.getBand(overallScore);

    // Run persistence in a database transaction with explicit timeout for cloud DB latency
    const completedAttempt = await this.prisma.$transaction(
      async (tx) => {
        // Mark any prior attempts as not latest
        await tx.assessmentAttempt.updateMany({
          where: { userId },
          data: { isLatest: false },
        });

        // Create or update attempt to COMPLETED
        const attempt = await tx.assessmentAttempt.create({
          data: {
            userId,
            versionId: version.id,
            status: AssessmentAttemptStatus.COMPLETED,
            overallScore,
            isLatest: true,
            completedAt: new Date(),
          },
        });

        // Insert all 50 responses
        const responsesData = allQuestions.map((q) => ({
          attemptId: attempt.id,
          questionId: q.id,
          response: responsesMap.get(q.questionCode)!,
        }));

        await tx.assessmentResponse.createMany({
          data: responsesData,
        });

        // Insert all 10 category scores
        await tx.assessmentCategoryScore.createMany({
          data: categoryCalculations.map((c) => ({
            attemptId: attempt.id,
            categoryId: c.categoryId,
            categoryName: c.categoryName,
            rawTotal: c.rawTotal,
            scorePercent: c.scorePercent,
            readinessBand: c.readinessBand,
            lowResponseCount: c.lowResponseCount,
            priorityRank: c.priorityRank,
            isTopPriority: c.isTopPriority,
          })),
        });

        // Unlock user onboarding gate
        await tx.user.update({
          where: { id: userId },
          data: {
            hasCompletedAssessment: true,
            lastAssessmentCompletedAt: new Date(),
          },
        });

        // Clean up any remaining draft attempts for this user
        await tx.assessmentAttempt.deleteMany({
          where: {
            userId,
            status: AssessmentAttemptStatus.DRAFT,
          },
        });

        return attempt;
      },
      { maxWait: 15000, timeout: 30000 },
    );

    // Fetch user details for notification
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const top3Categories = categoryCalculations
      .filter((c) => c.isTopPriority)
      .map((c) => c.categoryName);

    // Asynchronously send email notification (EM003: no score disclosure in subject)
    if (user) {
      const pathwayName =
        user.activePathway === 'SCHOLARSHIP' ? 'scholarship readiness' : 'career readiness';
      const pathwayDisplayName =
        user.activePathway === 'SCHOLARSHIP' ? 'Education & Scholarships' : 'Career & Employment';

      // Create in-app notification per Workbook U24 copy
      this.prisma.notification
        .create({
          data: {
            userId,
            title: 'Completed attempt',
            message: `Your ${pathwayDisplayName} results are ready.`,
            type: NotificationType.ASSESSMENT_RESULT,
            actionUrl: '/assessment/results',
            isRead: false,
          },
        })
        .catch((err) => {
          this.logger.warn(`Failed to create results notification: ${err.message}`);
        });

      this.mailService
        .sendAssessmentCompletedEmail(
          user.email,
          user.firstName || 'Learner',
          pathwayName,
        )
        .catch((err) => {
          this.logger.error(`Failed to send assessment email: ${err.message}`);
        });
    }

    // Delegate to Recommendation Engine for mapped Academy courses
    const top3CategoryIds = categoryCalculations
      .filter((c) => c.isTopPriority)
      .map((c) => c.categoryId);

    const recommendedCourses =
      await this.recommendationsService.getRecommendationsForPriorities(
        top3CategoryIds,
        overallBand,
      );

    return {
      attemptId: completedAttempt.id,
      completedAt: completedAttempt.completedAt,
      overallScore,
      overallBand,
      unlockedDashboard: true,
      topPriorityCategories: categoryCalculations.filter((c) => c.isTopPriority),
      categoryScores: categoryCalculations,
      recommendedCourses,
    };
  }

  /**
   * GET /api/assessment/results
   * Fetches latest completed assessment results
   */
  async getLatestResults(userId: string) {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        userId,
        status: AssessmentAttemptStatus.COMPLETED,
        isLatest: true,
      },
      include: {
        categoryScores: {
          orderBy: { priorityRank: 'asc' },
        },
      },
    });

    if (!attempt) {
      return {
        completed: false,
        message: 'No completed readiness assessment found.',
      };
    }

    const overallBand = this.getBand(attempt.overallScore || 0);

    const topCategoryIds = attempt.categoryScores
      .filter((c) => c.isTopPriority)
      .map((c) => c.categoryId);

    const recommendedCourses =
      await this.recommendationsService.getRecommendationsForPriorities(
        topCategoryIds,
        overallBand,
      );

    return {
      completed: true,
      attemptId: attempt.id,
      completedAt: attempt.completedAt,
      overallScore: attempt.overallScore,
      overallBand,
      categoryScores: attempt.categoryScores,
      topPriorityCategories: attempt.categoryScores.filter((c) => c.isTopPriority),
      recommendedCourses,
    };
  }
}
