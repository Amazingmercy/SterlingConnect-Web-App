import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NormalizedAcademyCourse {
  id: string;
  courseCode: string;
  title: string;
  description: string;
  duration: string;
  isFree: boolean;
  priceNGN: number;
  academyUrl: string;
  categoryId: string;
  categoryTitle: string;
  thumbnailUrl?: string;
  level: 'ESSENTIALS' | 'FUNDAMENTALS' | 'ADVANCED';
  recommendationReason?: string;
  matchedDimensions?: string[];
}

export interface NormalizedAcademyCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

@Injectable()
export class SterlingCoursesService {
  private readonly logger = new Logger(SterlingCoursesService.name);

  // In-memory cache to prevent excessive external requests
  private cachedCourses: NormalizedAcademyCourse[] | null = null;
  private cachedCategories: NormalizedAcademyCategory[] | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Configurable endpoints with database override fallback to environment variables
   */
  private async getCoursesUrl(): Promise<string> {
    try {
      const dbSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'apiEndpoints' },
      });
      if (dbSetting) {
        const parsed = JSON.parse(dbSetting.value);
        if (parsed.coursesApiUrl && parsed.coursesApiUrl.trim()) {
          return parsed.coursesApiUrl.trim();
        }
      }
    } catch {}
    return (
      process.env.STERLING_COURSES_API_URL ||
      'https://sterlinglrs.com/wp-json/tutor/v1/courses'
    );
  }

  private async getPricesUrl(): Promise<string> {
    try {
      const dbSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'apiEndpoints' },
      });
      if (dbSetting) {
        const parsed = JSON.parse(dbSetting.value);
        if (parsed.coursePricesApiUrl && parsed.coursePricesApiUrl.trim()) {
          return parsed.coursePricesApiUrl.trim();
        }
      }
    } catch {}
    return process.env.STERLING_COURSE_PRICES_API_URL || '';
  }

  /**
   * Helper to strip HTML tags and clean up whitespace & entities
   */
  private cleanHtml(input?: string): string {
    if (!input) return '';
    return input
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/\r?\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Fetch single course metadata (duration, benefits/summary, level)
   */
  private async fetchCourseDetail(baseUrl: string, courseId: number | string): Promise<any | null> {
    try {
      // If baseUrl is tutor/v1/courses, the detail endpoint is tutor/v1/courses/{id}
      const cleanBase = baseUrl.replace(/\/+$/, '');
      const detailUrl = `${cleanBase}/${courseId}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(detailUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch {
      // Ignore detail fetch errors, fallback to list item attributes
    }
    return null;
  }

  /**
   * Fetch categories from courses or DB
   */
  async getCategories(): Promise<NormalizedAcademyCategory[]> {
    const now = Date.now();
    if (this.cachedCategories && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedCategories;
    }

    // Try extracting categories from courses endpoint
    const courses = await this.getCourses();
    const categoriesMap = new Map<string, NormalizedAcademyCategory>();

    for (const c of courses) {
      if (c.categoryId && c.categoryTitle) {
        categoriesMap.set(c.categoryId, {
          id: c.categoryId,
          name: c.categoryTitle,
          slug: c.categoryId.toLowerCase(),
        });
      }
    }

    if (categoriesMap.size > 0) {
      this.cachedCategories = Array.from(categoriesMap.values());
      return this.cachedCategories;
    }

    // Fallback: DB categories
    const dbCats = await this.prisma.academyCategory.findMany({
      orderBy: { id: 'asc' },
    });
    this.cachedCategories = dbCats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.id.toLowerCase(),
      description: c.description || undefined,
    }));
    return this.cachedCategories;
  }

  /**
   * Fetch courses from external endpoint (Tutor LMS / WordPress), with fallback to DB
   */
  async getCourses(): Promise<NormalizedAcademyCourse[]> {
    const now = Date.now();
    if (this.cachedCourses && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedCourses;
    }

    const coursesUrl = await this.getCoursesUrl();
    const pricesUrl = await this.getPricesUrl();

    // 1. Attempt custom price endpoint if configured
    let pricesMap = new Map<string, { priceNGN: number; isFree: boolean }>();
    if (pricesUrl) {
      try {
        const pController = new AbortController();
        const pTimeout = setTimeout(() => pController.abort(), 5000);
        const pRes = await fetch(pricesUrl, {
          signal: pController.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(pTimeout);
        if (pRes.ok) {
          const pData = await pRes.json();
          const items = Array.isArray(pData) ? pData : pData.data || [];
          if (Array.isArray(items)) {
            for (const p of items) {
              const key = String(p.courseId || p.id || p.ID || p.courseCode || p.slug || '').toLowerCase();
              if (key) {
                pricesMap.set(key, {
                  priceNGN: Number(p.price || p.priceNGN || p.sale_price) || 0,
                  isFree: Boolean(p.isFree ?? (Number(p.price || p.priceNGN) === 0)),
                });
              }
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not load custom price endpoint: ${err.message}`);
      }
    }

    // 2. Fetch courses from external endpoint
    try {
      this.logger.log(`Fetching courses from ${coursesUrl}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(coursesUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          // Support both Tutor LMS { data: { posts: [...] } } and WP REST API [...]
          const rawPosts = json.data?.posts || json.posts || (Array.isArray(json) ? json : null);

          if (Array.isArray(rawPosts) && rawPosts.length > 0) {
            // Fetch detail for each course in parallel
            const detailedPosts = await Promise.all(
              rawPosts.map(async (p: any) => {
                const id = p.ID || p.id;
                const detail = id ? await this.fetchCourseDetail(coursesUrl, id) : null;
                return { post: p, detail };
              }),
            );

            this.cachedCourses = detailedPosts.map(({ post, detail }, idx) => {
              const id = String(post.ID || post.id || idx);
              const slug = post.post_name || post.slug || `course-${id}`;
              const courseCode = slug;
              const title = this.cleanHtml(post.post_title || post.title?.rendered || post.title || 'Course');
              
              // Brief explanation of course content
              let description = '';
              if (detail?.course_benefits && Array.isArray(detail.course_benefits) && detail.course_benefits.length > 0) {
                description = this.cleanHtml(detail.course_benefits.join('. '));
              } else if (post.excerpt?.rendered || post.post_content || post.description) {
                description = this.cleanHtml(post.excerpt?.rendered || post.post_content || post.description);
              }
              if (description.length > 220) {
                description = description.slice(0, 217) + '...';
              }
              if (!description) {
                description = 'Comprehensive module designed to strengthen practical skills.';
              }

              // Hours / Duration
              let duration = '2-4 hours';
              if (detail?.course_duration && Array.isArray(detail.course_duration) && detail.course_duration.length > 0) {
                const durObj = detail.course_duration[0];
                const h = parseInt(durObj.hours || '0', 10);
                const m = parseInt(durObj.minutes || '0', 10);
                if (h > 0 && m > 0) duration = `${h}h ${m}m`;
                else if (h > 0) duration = `${h} hours`;
                else if (m > 0) duration = `${m} mins`;
              } else if (post.meta?.duration) {
                duration = String(post.meta.duration);
              }

              // Direct link to course on Sterling Academy / site
              const academyUrl = `https://sterlinglrs.com/academy/${slug}/`;

              // Category
              const catObj = post.course_category?.[0];
              const categoryTitle = catObj?.name || 'Professional Development';
              const categoryId = String(catObj?.term_id || 'CAT-01');

              // Pricing
              const priceKey = id.toLowerCase();
              const priceByCustomKey = pricesMap.get(priceKey) || pricesMap.get(slug.toLowerCase());
              
              let isFree = false;
              let priceNGN = 0;

              if (priceByCustomKey) {
                isFree = priceByCustomKey.isFree;
                priceNGN = priceByCustomKey.priceNGN;
              } else {
                const rawPrice = Number(post.price || 0);
                const rawSalePrice = Number(post.sale_price || 0);
                isFree = (detail?.course_price_type?.[0] === 'free') || (rawPrice === 0 && rawSalePrice === 0);
                priceNGN = rawSalePrice > 0 ? rawSalePrice : rawPrice;
              }

              // Level
              let level: 'ESSENTIALS' | 'FUNDAMENTALS' | 'ADVANCED' = 'ESSENTIALS';
              const rawLevel = String(detail?.course_level?.[0] || post.level || '').toLowerCase();
              if (rawLevel.includes('intermediate') || rawLevel.includes('fund')) level = 'FUNDAMENTALS';
              else if (rawLevel.includes('expert') || rawLevel.includes('adv')) level = 'ADVANCED';

              return {
                id,
                courseCode,
                title,
                description,
                duration,
                isFree,
                priceNGN,
                academyUrl,
                categoryId,
                categoryTitle,
                thumbnailUrl: post.thumbnail_url || undefined,
                level,
              };
            });

            this.lastFetchTime = Date.now();
            return this.cachedCourses;
          }
        }
      }
      this.logger.warn(
        `External courses endpoint returned status ${res.status}. Using database fallback.`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Failed to fetch external courses (${err.message}). Using database fallback.`,
      );
    }

    // Fallback to database academyCourse records if external endpoint is temporarily unreachable
    const dbCourses = await this.prisma.academyCourse.findMany({
      where: { isPublished: true },
      include: { category: true },
      orderBy: [{ isFree: 'desc' }, { level: 'asc' }],
    });

    this.cachedCourses = dbCourses.map((c) => ({
      id: c.id,
      courseCode: c.courseCode,
      title: c.title,
      description: c.notes || 'Targeted module designed to bridge diagnostic readiness gaps.',
      duration: c.duration || '2-4 hours',
      isFree: c.isFree,
      priceNGN: Number(c.priceNGN) || 0,
      academyUrl: c.enrollmentUrl || 'https://learn.sterlinglrs.com',
      categoryId: c.categoryId,
      categoryTitle: c.category?.name || 'Professional Development',
      level: c.level as 'ESSENTIALS' | 'FUNDAMENTALS' | 'ADVANCED',
    }));

    this.lastFetchTime = Date.now();
    return this.cachedCourses;
  }
}
