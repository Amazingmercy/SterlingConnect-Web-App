import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpportunityStatus, OpportunityType, WorkArrangement, FundingLevel } from '@prisma/client';

@Injectable()
export class SterlingOpportunitiesSyncService {
  private readonly logger = new Logger(SterlingOpportunitiesSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Configurable opportunities endpoint with database override fallback to environment variables
   */
  private async getOpportunitiesApiUrl(): Promise<string> {
    try {
      const dbSetting = await this.prisma.systemSetting.findUnique({
        where: { key: 'apiEndpoints' },
      });
      if (dbSetting) {
        const parsed = JSON.parse(dbSetting.value);
        if (parsed.opportunitiesApiUrl && parsed.opportunitiesApiUrl.trim()) {
          return parsed.opportunitiesApiUrl.trim();
        }
      }
    } catch {}
    return (
      process.env.STERLING_OPPORTUNITIES_API_URL ||
      'https://sterlinglrs.com/wp-json/tutor/v1/opportunities'
    );
  }

  /**
   * Helper to strip HTML tags and normalize text
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
      .replace(/\r?\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize an external raw opportunity object into Sterling Connect schema
   */
  private normalizeOpportunity(raw: any, index: number) {
    const title = this.cleanHtml(raw.title?.rendered || raw.title || raw.post_title || `Opportunity ${index + 1}`);
    const rawContent = raw.content?.rendered || raw.content || raw.post_content || raw.overview || raw.description || '';
    const overview = this.cleanHtml(rawContent) || `${title} offered through Sterling partner network.`;
    const requirements = this.cleanHtml(raw.requirements || raw.excerpt?.rendered || raw.excerpt) || 'Open to qualified candidates. Refer to the application portal for full criteria.';
    
    // Determine opportunity type
    const lowerTitle = title.toLowerCase();
    const lowerContent = overview.toLowerCase();
    const isScholarship =
      raw.opportunityType === 'SCHOLARSHIP' ||
      raw.type === 'scholarship' ||
      lowerTitle.includes('scholarship') ||
      lowerTitle.includes('fellowship') ||
      lowerTitle.includes('grant') ||
      lowerTitle.includes('bursary') ||
      lowerContent.includes('scholarship');

    const opportunityType: OpportunityType = isScholarship
      ? OpportunityType.SCHOLARSHIP
      : OpportunityType.EMPLOYMENT;

    const organization =
      this.cleanHtml(raw.organization || raw.company || raw.provider || raw.author_name) ||
      'Sterling Learning & Research Solutions';

    const country = raw.country || 'Nigeria';
    const location = raw.location || (raw.isRemote ? 'Remote' : 'Lagos, Nigeria');
    const applicationUrl =
      raw.applicationUrl || raw.url || raw.link || raw.guid?.rendered || 'https://sterlinglrs.com';

    let deadline = new Date();
    if (raw.deadline) {
      const parsed = new Date(raw.deadline);
      if (!isNaN(parsed.getTime())) {
        deadline = parsed;
      } else {
        deadline.setDate(deadline.getDate() + 45);
      }
    } else {
      deadline.setDate(deadline.getDate() + 45);
    }

    const extId = String(raw.id || raw.ID || `EXT-${index + 1}`);
    const referenceCode = raw.referenceCode || `OPP-${opportunityType === OpportunityType.SCHOLARSHIP ? 'SCH' : 'EMP'}-${extId}`;

    return {
      referenceCode,
      title,
      organization,
      opportunityType,
      country,
      location,
      status: OpportunityStatus.PUBLISHED,
      deadline,
      applicationUrl,
      sourceUrl: applicationUrl,
      overview,
      requirements,
      isFeatured: Boolean(raw.isFeatured || raw.featured),
      raw,
    };
  }

  /**
   * Ingest a batch of opportunities into the local database
   */
  async ingestOpportunities(items: any[]): Promise<{ count: number; opportunities: any[] }> {
    if (!Array.isArray(items) || items.length === 0) {
      return { count: 0, opportunities: [] };
    }

    const saved: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const normalized = this.normalizeOpportunity(items[i], i);

      try {
        const opp = await this.prisma.opportunity.upsert({
          where: { referenceCode: normalized.referenceCode },
          update: {
            title: normalized.title,
            organization: normalized.organization,
            opportunityType: normalized.opportunityType,
            country: normalized.country,
            location: normalized.location,
            status: OpportunityStatus.PUBLISHED,
            deadline: normalized.deadline,
            applicationUrl: normalized.applicationUrl,
            sourceUrl: normalized.sourceUrl,
            overview: normalized.overview,
            requirements: normalized.requirements,
            isFeatured: normalized.isFeatured,
          },
          create: {
            referenceCode: normalized.referenceCode,
            title: normalized.title,
            organization: normalized.organization,
            opportunityType: normalized.opportunityType,
            country: normalized.country,
            location: normalized.location,
            status: OpportunityStatus.PUBLISHED,
            deadline: normalized.deadline,
            applicationUrl: normalized.applicationUrl,
            sourceUrl: normalized.sourceUrl,
            overview: normalized.overview,
            requirements: normalized.requirements,
            isFeatured: normalized.isFeatured,
          },
        });

        // Upsert detail record based on type
        if (normalized.opportunityType === OpportunityType.EMPLOYMENT) {
          await this.prisma.employmentOpportunityDetail.upsert({
            where: { opportunityId: opp.id },
            update: {
              subType: 'Full-time',
              workArrangement: WorkArrangement.HYBRID,
              sector: 'Professional Services',
              function: 'Operations & Strategy',
              experienceLevel: 'Entry',
              minimumEducation: "Bachelor's Degree",
              eligibleNationalities: JSON.stringify(['Any']),
              requiredSkills: JSON.stringify(['Communication', 'Problem Solving']),
            },
            create: {
              opportunityId: opp.id,
              subType: 'Full-time',
              workArrangement: WorkArrangement.HYBRID,
              sector: 'Professional Services',
              function: 'Operations & Strategy',
              experienceLevel: 'Entry',
              minimumEducation: "Bachelor's Degree",
              eligibleNationalities: JSON.stringify(['Any']),
              requiredSkills: JSON.stringify(['Communication', 'Problem Solving']),
            },
          });
        } else {
          await this.prisma.scholarshipOpportunityDetail.upsert({
            where: { opportunityId: opp.id },
            update: {
              fundingLevel: FundingLevel.FULLY_FUNDED,
              studyLevels: JSON.stringify(["Master's Degree", "PhD"]),
              eligibleFields: JSON.stringify(['Business', 'Technology', 'Sciences', 'Humanities']),
              eligibleNationalities: JSON.stringify(['All']),
              academicRequirement: 'First Class or 2:1 equivalent',
            },
            create: {
              opportunityId: opp.id,
              fundingLevel: FundingLevel.FULLY_FUNDED,
              studyLevels: JSON.stringify(["Master's Degree", "PhD"]),
              eligibleFields: JSON.stringify(['Business', 'Technology', 'Sciences', 'Humanities']),
              eligibleNationalities: JSON.stringify(['All']),
              academicRequirement: 'First Class or 2:1 equivalent',
            },
          });
        }

        saved.push(opp);
      } catch (err: any) {
        this.logger.warn(`Failed to upsert opportunity '${normalized.title}': ${err.message}`);
      }
    }

    return { count: saved.length, opportunities: saved };
  }

  /**
   * Sync opportunities from the external API endpoint
   */
  async syncFromApi(customUrl?: string): Promise<{ syncedCount: number; message: string }> {
    const url = customUrl || (await this.getOpportunitiesApiUrl());
    this.logger.log(`Fetching opportunities from external API: ${url}`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        this.logger.warn(`External opportunities API returned HTTP ${res.status}`);
        return {
          syncedCount: 0,
          message: `External API responded with status ${res.status}.`,
        };
      }

      const json = await res.json();
      let rawList: any[] = [];

      if (Array.isArray(json)) {
        rawList = json;
      } else if (Array.isArray(json.data)) {
        rawList = json.data;
      } else if (Array.isArray(json.data?.posts)) {
        rawList = json.data.posts;
      } else if (Array.isArray(json.posts)) {
        rawList = json.posts;
      } else if (Array.isArray(json.opportunities)) {
        rawList = json.opportunities;
      }

      if (rawList.length === 0) {
        return {
          syncedCount: 0,
          message: 'External API reachable but returned 0 opportunity records.',
        };
      }

      const { count } = await this.ingestOpportunities(rawList);
      return {
        syncedCount: count,
        message: `Successfully synchronized ${count} opportunities from external API.`,
      };
    } catch (err: any) {
      this.logger.error(`Error connecting to external opportunities API: ${err.message}`);
      return {
        syncedCount: 0,
        message: `Failed to connect to external opportunities API: ${err.message}`,
      };
    }
  }
}
