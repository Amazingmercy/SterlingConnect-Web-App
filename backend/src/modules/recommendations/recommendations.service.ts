import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';
import { CourseLevel, Pathway, AssessmentAttemptStatus } from '@prisma/client';

export type ReadinessBandType = 'EMERGING' | 'FOUNDATIONAL' | 'DEVELOPING' | 'PROFICIENT';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to determine readiness band from score
   */
  private getBand(score: number): ReadinessBandType {
    if (score >= 75) return 'PROFICIENT';
    if (score >= 50) return 'DEVELOPING';
    if (score >= 25) return 'FOUNDATIONAL';
    return 'EMERGING';
  }

  /**
   * Helper to match band synonyms and "ALL" wildcards
   */
  private getBandVariants(band?: string): string[] {
    if (!band) return ['ALL', 'ALL_BANDS'];
    const b = band.toUpperCase().trim();
    const variants = new Set<string>([b, 'ALL', 'ALL_BANDS']);
    if (b === 'EMERGING' || b === 'BUILDING FOUNDATIONS' || b === 'BUILDING_FOUNDATIONS') {
      variants.add('EMERGING');
      variants.add('BUILDING FOUNDATIONS');
      variants.add('BUILDING_FOUNDATIONS');
      variants.add('FOUNDATIONAL');
    } else if (b === 'FOUNDATIONAL' || b === 'FOUNDATIONS') {
      variants.add('FOUNDATIONAL');
      variants.add('EMERGING');
    } else if (b === 'DEVELOPING') {
      variants.add('DEVELOPING');
    } else if (b === 'PROGRESSING' || b === 'PROFICIENT' || b === 'STRONG READINESS' || b === 'STRONG_READINESS') {
      variants.add('PROGRESSING');
      variants.add('PROFICIENT');
      variants.add('STRONG READINESS');
      variants.add('STRONG_READINESS');
    }
    return Array.from(variants);
  }

  /**
   * Core Recommendation Engine Logic
   * Evaluates diagnostic category gaps and active RecommendationRule records set by Admin.
   * Preserves admin priority mappings and aggregates reasons on deduplication per U16 spec.
   */
  async getRecommendationsForPriorities(
    topPriorityCategoryIds: string[],
    readinessBand?: string,
    userPathway?: string,
    categoryDetails?: { categoryId: string; categoryName?: string; readinessBand?: string }[],
  ) {
    if (!topPriorityCategoryIds || topPriorityCategoryIds.length === 0) {
      return [];
    }

    const bandVariants = readinessBand ? this.getBandVariants(readinessBand) : ['ALL', 'ALL_BANDS'];

    // Map of categoryId -> { categoryName, readinessBand }
    const categoryInfoMap = new Map<string, { categoryName?: string; readinessBand?: string }>();
    if (categoryDetails && categoryDetails.length > 0) {
      for (const d of categoryDetails) {
        categoryInfoMap.set(d.categoryId, d);
      }
    }

    // 1. Fetch active rules for the candidate's priority categories
    const activeRules = await this.prisma.recommendationRule.findMany({
      where: {
        categoryId: { in: topPriorityCategoryIds },
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Score/rank matching rules: exact category band match or ALL gets highest priority
    const prioritizedRules: typeof activeRules = [];
    const secondaryRules: typeof activeRules = [];

    for (const rule of activeRules) {
      const catSpecificBand = categoryInfoMap.get(rule.categoryId)?.readinessBand;
      const catSpecificVariants = catSpecificBand ? this.getBandVariants(catSpecificBand) : [];
      const ruleBandUpper = (rule.readinessBand || '').toUpperCase().trim();

      const isExactMatch =
        ruleBandUpper === 'ALL' ||
        ruleBandUpper === 'ALL_BANDS' ||
        (catSpecificBand && catSpecificVariants.includes(ruleBandUpper)) ||
        (readinessBand && bandVariants.includes(ruleBandUpper));

      if (isExactMatch) {
        prioritizedRules.push(rule);
      } else {
        secondaryRules.push(rule);
      }
    }

    // Rules matching active admin definitions in order
    const effectiveRules = [...prioritizedRules, ...secondaryRules];
    const ruleCourseCodes = effectiveRules.map((r) => r.courseCode);

    // Track which categories mapped to each courseCode via admin rules
    const courseToCategoriesMap = new Map<string, Set<string>>();
    for (const rule of effectiveRules) {
      if (!courseToCategoriesMap.has(rule.courseCode)) {
        courseToCategoriesMap.set(rule.courseCode, new Set());
      }
      const catName = categoryInfoMap.get(rule.categoryId)?.categoryName || rule.categoryId;
      courseToCategoriesMap.get(rule.courseCode)!.add(catName);
    }

    // 2. Query matching courses prioritized by admin rule mapping
    let ruleCourses: any[] = [];
    if (ruleCourseCodes.length > 0) {
      const fetchedRuleCourses = await this.prisma.academyCourse.findMany({
        where: {
          courseCode: { in: ruleCourseCodes },
          isPublished: true,
        },
        include: {
          category: {
            select: { id: true, name: true, description: true },
          },
        },
      });

      // Maintain order specified by matching admin rules
      for (const code of ruleCourseCodes) {
        const found = fetchedRuleCourses.find((c) => c.courseCode === code);
        if (found && !ruleCourses.some((rc) => rc.id === found.id)) {
          ruleCourses.push(found);
        }
      }
    }

    // 3. Query general category courses for any priority categories without a specific admin rule
    const ruleCourseIds = ruleCourses.map((rc) => rc.id);
    const generalCourses = await this.prisma.academyCourse.findMany({
      where: {
        categoryId: { in: topPriorityCategoryIds },
        isPublished: true,
        ...(ruleCourseIds.length > 0 ? { id: { notIn: ruleCourseIds } } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: [{ categoryId: 'asc' }, { level: 'asc' }],
    });

    // Populate category names for general courses
    for (const gc of generalCourses) {
      if (!courseToCategoriesMap.has(gc.courseCode)) {
        courseToCategoriesMap.set(gc.courseCode, new Set());
      }
      const catName = categoryInfoMap.get(gc.categoryId)?.categoryName || gc.category?.name || gc.categoryId;
      courseToCategoriesMap.get(gc.courseCode)!.add(catName);
    }

    // Merge rule-mapped courses first, followed by dimension-mapped courses
    const allCandidates = [...ruleCourses, ...generalCourses];

    // Deduplicate courses by id while aggregating matched category reasons per U16 spec:
    // "Gap recommendation; aggregate reasons on dedup"
    const seen = new Set<string>();
    const deduplicatedCourses: any[] = [];

    for (const c of allCandidates) {
      if (seen.has(c.id)) {
        continue;
      }
      seen.add(c.id);

      const categoryNamesSet = courseToCategoriesMap.get(c.courseCode) || new Set([c.category?.name || 'this area']);
      const categoryNames = Array.from(categoryNamesSet);

      let formattedDimensionLabel: string;
      if (categoryNames.length === 1) {
        formattedDimensionLabel = categoryNames[0];
      } else if (categoryNames.length === 2) {
        formattedDimensionLabel = `${categoryNames[0]} and ${categoryNames[1]}`;
      } else {
        formattedDimensionLabel = `${categoryNames.slice(0, -1).join(', ')} and ${categoryNames[categoryNames.length - 1]}`;
      }

      deduplicatedCourses.push({
        ...c,
        matchedDimensions: categoryNames,
        recommendationReason: `Recommended to help you strengthen ${formattedDimensionLabel}.`,
      });
    }

    // Policy Rule (Workbook & Copy Spec):
    // "Never show a scholarship learner a paid course as scholarship preparation."
    const isScholarship =
      userPathway === Pathway.SCHOLARSHIP ||
      userPathway === 'Education & Scholarship Opportunities' ||
      userPathway === 'Education & Scholarships';

    const filtered = deduplicatedCourses.filter((c) => {
      if (isScholarship && c.categoryId === 'CAT-02' && !c.isFree) {
        return false;
      }
      return true;
    });

    // Sort order: Free courses first, then Essentials -> Fundamentals -> Advanced
    const levelOrder: Record<string, number> = {
      ESSENTIALS: 1,
      FUNDAMENTALS: 2,
      ADVANCED: 3,
    };

    filtered.sort((a, b) => {
      // Free first
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;

      // Level next
      const levelA = levelOrder[a.level] || 99;
      const levelB = levelOrder[b.level] || 99;
      if (levelA !== levelB) return levelA - levelB;

      return a.courseCode.localeCompare(b.courseCode);
    });

    return filtered;
  }

  /**
   * GET /api/recommendations
   * Candidate personalized recommendations based on assessment results and pathway goal
   */
  async getRecommendationsForCandidate(
    userId?: string,
    query?: RecommendationQueryDto,
  ) {
    let latestAttempt: any = null;
    let userPathway: string | undefined = query?.pathway;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          assessmentAttempts: {
            where: { status: AssessmentAttemptStatus.COMPLETED },
            orderBy: { completedAt: 'desc' },
            take: 1,
            include: {
              categoryScores: true,
            },
          },
        },
      });

      if (user) {
        if (!userPathway) userPathway = user.activePathway;
        latestAttempt = user.assessmentAttempts?.[0] || null;
      }
    }

    // Case 1: Candidate has completed an assessment -> gap-driven recommendations
    if (latestAttempt && latestAttempt.categoryScores?.length > 0) {
      const overallBand = this.getBand(latestAttempt.overallScore || 0);

      // Find top 3 priority categories (lowest scoring categories marked isTopPriority or priorityRank 1..3)
      let topCategoryScores = latestAttempt.categoryScores
        .filter((c: any) => c.isTopPriority || (c.priorityRank && c.priorityRank <= 3))
        .sort((a: any, b: any) => (a.priorityRank || 99) - (b.priorityRank || 99));

      // Fallback: lowest 3 by scorePercent if none explicitly marked
      if (topCategoryScores.length === 0) {
        topCategoryScores = [...latestAttempt.categoryScores]
          .sort((a: any, b: any) => (a.scorePercent ?? a.percentageScore ?? 0) - (b.scorePercent ?? b.percentageScore ?? 0))
          .slice(0, 3);
      }

      // Filter by query category if specified
      if (query?.categoryId) {
        topCategoryScores = latestAttempt.categoryScores.filter((c: any) => c.categoryId === query.categoryId);
      }

      const topCategoryIds = topCategoryScores.map((c: any) => c.categoryId);
      const categoryDetails = topCategoryScores.map((c: any) => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        readinessBand: c.readinessBand,
      }));

      const courses = await this.getRecommendationsForPriorities(
        topCategoryIds,
        overallBand,
        userPathway,
        categoryDetails,
      );

      // Further apply query level / isFree filters if provided
      let finalCourses = courses;
      if (query?.level) {
        finalCourses = finalCourses.filter(
          (c) => c.level.toLowerCase() === query.level?.toLowerCase(),
        );
      }
      if (query?.isFree !== undefined) {
        finalCourses = finalCourses.filter((c) => c.isFree === query.isFree);
      }
      if (query?.search) {
        const s = query.search.toLowerCase();
        finalCourses = finalCourses.filter(
          (c) =>
            c.title.toLowerCase().includes(s) ||
            c.courseCode.toLowerCase().includes(s) ||
            c.category?.name.toLowerCase().includes(s),
        );
      }

      return {
        hasAssessment: true,
        attemptId: latestAttempt.id,
        completedAt: latestAttempt.completedAt,
        overallScore: latestAttempt.overallScore,
        overallBand,
        priorityCategories: latestAttempt.categoryScores.filter((c: any) =>
          topCategoryIds.includes(c.categoryId),
        ),
        recommendations: finalCourses,
        total: finalCourses.length,
      };
    }

    // Case 2: No completed assessment yet -> Pathway Goal-Driven Recommendations
    const goalCategoryIds: string[] = [];
    if (
      userPathway === Pathway.SCHOLARSHIP ||
      userPathway === 'Education & Scholarship Opportunities' ||
      userPathway === 'Education & Scholarships'
    ) {
      goalCategoryIds.push('CAT-02', 'CAT-04'); // Scholarship & Academic Readiness
    } else {
      goalCategoryIds.push('CAT-01', 'CAT-03', 'CAT-05'); // Career, CV, Communication
    }

    const where: any = {
      isPublished: true,
    };

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    } else if (goalCategoryIds.length > 0) {
      where.categoryId = { in: goalCategoryIds };
    }

    if (query?.level) {
      where.level = query.level.toUpperCase() as CourseLevel;
    }

    if (query?.isFree !== undefined) {
      where.isFree = query.isFree;
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search } },
        { courseCode: { contains: query.search } },
      ];
    }

    // Check if there are active recommendation rules for these goal categories
    const matchingGoalRules = await this.prisma.recommendationRule.findMany({
      where: {
        categoryId: { in: goalCategoryIds },
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const ruleCourseCodes = matchingGoalRules.map((r) => r.courseCode);

    const courses = await this.prisma.academyCourse.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: [{ isFree: 'desc' }, { level: 'asc' }],
    });

    const isScholarship =
      userPathway === Pathway.SCHOLARSHIP ||
      userPathway === 'Education & Scholarship Opportunities' ||
      userPathway === 'Education & Scholarships';

    const goalLabel = isScholarship ? 'Scholarship & Academic Preparation' : 'Employment & Career Readiness';

    // Prioritize rule courses first, then general
    const ruleMappedCourses: any[] = [];
    const nonRuleCourses: any[] = [];
    for (const c of courses) {
      if (ruleCourseCodes.includes(c.courseCode)) {
        ruleMappedCourses.push(c);
      } else {
        nonRuleCourses.push(c);
      }
    }

    const combinedCourses = [...ruleMappedCourses, ...nonRuleCourses];

    const mappedWithReasons = combinedCourses
      .filter((c) => {
        if (isScholarship && c.categoryId === 'CAT-02' && !c.isFree) {
          return false;
        }
        return true;
      })
      .map((c) => ({
        ...c,
        recommendationReason: `Suggested for your goal: ${goalLabel}.`,
      }));

    return {
      hasAssessment: false,
      overallScore: null,
      overallBand: null,
      priorityCategories: [],
      goalNotice: `Suggested courses for your active goal (${goalLabel}). Complete the readiness assessment to see preparation actions based on your answers.`,
      recommendations: mappedWithReasons,
      total: mappedWithReasons.length,
    };
  }

  /**
   * GET /api/recommendations/courses
   * Full course catalog exploration
   */
  async getAllCourses(query?: RecommendationQueryDto) {
    const where: any = {
      isPublished: true,
    };

    if (query?.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query?.level) {
      where.level = query.level.toUpperCase() as CourseLevel;
    }

    if (query?.isFree !== undefined) {
      where.isFree = query.isFree;
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search } },
        { courseCode: { contains: query.search } },
      ];
    }

    const courses = await this.prisma.academyCourse.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: [{ isFree: 'desc' }, { categoryId: 'asc' }, { level: 'asc' }],
    });

    return {
      total: courses.length,
      courses,
    };
  }

  /**
   * Diagnostic dimension categories
   */
  async getCategories() {
    return this.prisma.academyCategory.findMany({
      orderBy: { id: 'asc' },
    });
  }
}
