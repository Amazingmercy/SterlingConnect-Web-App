export type CategoryId =
  | 'CAT-01'
  | 'CAT-02'
  | 'CAT-03'
  | 'CAT-04'
  | 'CAT-05'
  | 'CAT-06'
  | 'CAT-07'
  | 'CAT-08'
  | 'CAT-09'
  | 'CAT-10';

export type PerformanceBand = 'Emerging' | 'Foundational' | 'Developing' | 'Proficient';

export type CourseLevel = 'Essentials' | 'Fundamentals' | 'Advanced';

export interface AssessmentQuestion {
  id: string; // e.g. "Q01"
  categoryId: CategoryId;
  categoryTitle: string;
  order: number; // 1 to 5 within category
  statement: string;
}

export interface CategoryResult {
  categoryId: CategoryId;
  categoryTitle: string;
  score: number; // 0 - 100
  band: PerformanceBand;
  rawAnswers: number[]; // 5 answers (1-5)
  rawSum: number; // 5 - 25
  lowAnswerCount: number; // count of answers <= 2
}

export interface AssessmentResult {
  completedAt: string;
  version: string;
  overallScore: number; // Average across the 10 categories
  categoryResults: CategoryResult[]; // All 10 categories
  priorityCategories: CategoryResult[]; // Exactly 3 deterministic lowest categories
  strengths: CategoryResult[]; // Top performing categories (score >= 75)
}

export interface RecommendedCourse {
  id: string;
  courseCode: string;
  categoryId: CategoryId;
  categoryTitle: string;
  title: string;
  level: CourseLevel;
  duration: string;
  isFree: boolean;
  priceNGN?: number;
  academyUrl: string;
  description: string;
  thumbnailUrl?: string;
  rating?: string;
  format?: 'Sterling Short' | 'Course';
  access?: 'Free' | 'Paid';
  estimatedTime?: string;
  release?: 'Launch' | 'Wave 2';
  recommendationReason?: string;
}
