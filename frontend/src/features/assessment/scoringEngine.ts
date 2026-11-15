import type {
  CategoryId,
  CategoryResult,
  AssessmentResult,
  PerformanceBand,
  RecommendedCourse,
} from '../../types/assessment';
import { ASSESSMENT_QUESTIONS } from './data/questions';
import { ACADEMY_COURSES } from './data/courses';

/**
 * Calculates the score and band for a single category using the official formula:
 * Score = ((SUM(5 answers) - 5) / 20) * 100
 */
export function calculateCategoryScore(
  categoryId: CategoryId,
  categoryTitle: string,
  answers: number[]
): CategoryResult {
  if (answers.length !== 5) {
    throw new Error(`Category ${categoryId} requires exactly 5 responses, got ${answers.length}`);
  }

  const rawSum = answers.reduce((acc, v) => acc + v, 0);
  const score = Math.round(((rawSum - 5) / 20) * 100);
  const lowAnswerCount = answers.filter((v) => v <= 2).length;

  let band: PerformanceBand = 'Emerging';
  if (score >= 75) {
    band = 'Proficient';
  } else if (score >= 50) {
    band = 'Developing';
  } else if (score >= 25) {
    band = 'Foundational';
  } else {
    band = 'Emerging';
  }

  return {
    categoryId,
    categoryTitle,
    score,
    band,
    rawAnswers: answers,
    rawSum,
    lowAnswerCount,
  };
}

/**
 * Calculates complete assessment results across all 10 categories,
 * deterministic top 3 priority areas, and strengths.
 */
export function calculateAssessmentResult(
  userAnswers: Record<string, number>
): AssessmentResult {
  const categoryIds: CategoryId[] = [
    'CAT-01',
    'CAT-02',
    'CAT-03',
    'CAT-04',
    'CAT-05',
    'CAT-06',
    'CAT-07',
    'CAT-08',
    'CAT-09',
    'CAT-10',
  ];

  const categoryResults: CategoryResult[] = categoryIds.map((catId) => {
    const catQuestions = ASSESSMENT_QUESTIONS.filter((q) => q.categoryId === catId);
    const answers = catQuestions.map((q) => userAnswers[q.id] || 3);
    const title = catQuestions[0]?.categoryTitle || catId;
    return calculateCategoryScore(catId, title, answers);
  });

  // Calculate overall score (average of the 10 category scores)
  const overallSum = categoryResults.reduce((acc, c) => acc + c.score, 0);
  const overallScore = Math.round(overallSum / categoryResults.length);

  // Deterministic 3-tier sort for Priority Development Areas (SC-07 / QA-04 to QA-08):
  // 1. Score ASCENDING
  // 2. Count of low answers (<= 2) DESCENDING
  // 3. Category ID ASCENDING (deterministic tie-break)
  const sortedForPriority = [...categoryResults].sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }
    if (b.lowAnswerCount !== a.lowAnswerCount) {
      return b.lowAnswerCount - a.lowAnswerCount;
    }
    return a.categoryId.localeCompare(b.categoryId);
  });

  const priorityCategories = sortedForPriority.slice(0, 3);

  // Strengths: Categories scoring >= 75% sorted DESCENDING
  const strengths = categoryResults
    .filter((c) => c.score >= 75)
    .sort((a, b) => b.score - a.score);

  return {
    completedAt: new Date().toISOString(),
    version: '2.0-developer-spec',
    overallScore,
    categoryResults,
    priorityCategories,
    strengths,
  };
}

/**
 * Maps the 3 priority development areas to recommended Academy courses
 * according to priority order and score thresholds.
 */
export function getRecommendedCoursesForPriorities(
  priorityCategories: CategoryResult[]
): RecommendedCourse[] {
  const recommendations: RecommendedCourse[] = [];

  priorityCategories.forEach((cat, index) => {
    const priorityIndex = index + 1; // 1, 2, or 3
    const categoryCourses = ACADEMY_COURSES.filter((c) => c.categoryId === cat.categoryId);

    if (categoryCourses.length === 0) return;

    if (priorityIndex === 1) {
      // Priority 1 (Lowest score): Essentials first, then Fundamentals
      const essentials = categoryCourses.filter((c) => c.level === 'Essentials');
      const fundamentals = categoryCourses.filter((c) => c.level === 'Fundamentals');
      recommendations.push(...(essentials.length > 0 ? essentials : categoryCourses));
      if (essentials.length > 0 && fundamentals.length > 0) {
        recommendations.push(fundamentals[0]);
      }
    } else if (priorityIndex === 2) {
      // Priority 2: Essentials or Fundamentals
      const matched = categoryCourses.filter(
        (c) => c.level === 'Essentials' || c.level === 'Fundamentals'
      );
      recommendations.push(...(matched.length > 0 ? matched : categoryCourses));
    } else {
      // Priority 3: Fundamentals then Advanced
      const fundamentals = categoryCourses.filter((c) => c.level === 'Fundamentals');
      const advanced = categoryCourses.filter((c) => c.level === 'Advanced');
      if (fundamentals.length > 0) recommendations.push(...fundamentals);
      if (advanced.length > 0) recommendations.push(...advanced);
      if (recommendations.length === 0) recommendations.push(...categoryCourses);
    }
  });

  // Deduplicate by course ID and ensure free courses always show before paid
  const seen = new Set<string>();
  const deduplicated = recommendations.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  return deduplicated.sort((a, b) => {
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return 0;
  });
}
