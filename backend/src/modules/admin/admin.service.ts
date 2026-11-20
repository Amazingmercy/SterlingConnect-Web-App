import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  UserRole,
  UserStatus,
  Pathway,
  OpportunityType,
  OpportunityStatus,
  WorkArrangement,
  FundingLevel,
  TaxonomyType,
  AssessmentVersionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { SterlingCoursesService } from '../recommendations/sterling-courses.service';
import { SterlingOpportunitiesSyncService } from '../opportunities/sterling-opportunities-sync.service';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from './dto/admin-opportunity.dto';
import { parse as parseCsv } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
    private readonly sterlingCoursesService: SterlingCoursesService,
    private readonly sterlingOpportunitiesSyncService: SterlingOpportunitiesSyncService,
  ) {}

  async syncOpportunitiesFromApi(customUrl?: string) {
    return this.sterlingOpportunitiesSyncService.syncFromApi(customUrl);
  }

  // ==========================================
  // A02: PLATFORM OVERVIEW & KPIS
  // ==========================================
  async getOverviewStats(startDate?: string, endDate?: string) {
    const userWhere: any = {};
    if (startDate || endDate) {
      userWhere.createdAt = {};
      if (startDate) userWhere.createdAt.gte = new Date(startDate);
      if (endDate) userWhere.createdAt.lte = new Date(endDate);
    }

    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      employmentPathwayUsers,
      scholarshipPathwayUsers,
      completedAssessmentsUsers,
      totalOpportunities,
      publishedOpportunities,
      draftOpportunities,
      archivedOpportunities,
      employmentOpportunities,
      scholarshipOpportunities,
      applicationsByStatus,
      totalApplications,
      emailLogsSummary,
      recentEmailLogs,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count({ where: userWhere }),
      this.prisma.user.count({ where: { ...userWhere, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { ...userWhere, status: UserStatus.PENDING_VERIFICATION } }),
      this.prisma.user.count({ where: { ...userWhere, status: UserStatus.SUSPENDED } }),
      this.prisma.user.count({ where: { ...userWhere, activePathway: Pathway.EMPLOYMENT } }),
      this.prisma.user.count({ where: { ...userWhere, activePathway: Pathway.SCHOLARSHIP } }),
      this.prisma.user.count({ where: { ...userWhere, hasCompletedAssessment: true } }),
      this.prisma.opportunity.count(),
      this.prisma.opportunity.count({ where: { status: OpportunityStatus.PUBLISHED } }),
      this.prisma.opportunity.count({ where: { status: OpportunityStatus.DRAFT } }),
      this.prisma.opportunity.count({ where: { status: OpportunityStatus.ARCHIVED } }),
      this.prisma.opportunity.count({ where: { opportunityType: OpportunityType.EMPLOYMENT } }),
      this.prisma.opportunity.count({ where: { opportunityType: OpportunityType.SCHOLARSHIP } }),
      this.prisma.application.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.application.count(),
      this.prisma.emailLog.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.emailLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      }),
    ]);

    const stageCounts: Record<string, number> = {
      SAVED: 0,
      PREPARING: 0,
      APPLIED: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      OFFER_SUCCESSFUL: 0,
      AWARDED: 0,
      UNSUCCESSFUL: 0,
      WITHDRAWN: 0,
    };
    for (const item of applicationsByStatus) {
      stageCounts[item.status] = item._count.id;
    }

    const emailStatusCounts: Record<string, number> = {
      SENT: 0,
      FAILED: 0,
      QUEUED: 0,
    };
    for (const item of emailLogsSummary) {
      emailStatusCounts[item.status] = item._count.id;
    }

    const readinessCompletionRate =
      totalUsers > 0 ? Math.round((completedAssessmentsUsers / totalUsers) * 100) : 0;

    const noData = totalUsers === 0 && totalOpportunities === 0 && totalApplications === 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        pendingVerification: pendingUsers,
        suspended: suspendedUsers,
        byPathway: {
          employment: employmentPathwayUsers,
          scholarship: scholarshipPathwayUsers,
        },
        readinessCompleted: completedAssessmentsUsers,
        readinessCompletionRate,
      },
      opportunities: {
        total: totalOpportunities,
        published: publishedOpportunities,
        draft: draftOpportunities,
        archived: archivedOpportunities,
        byType: {
          employment: employmentOpportunities,
          scholarship: scholarshipOpportunities,
        },
      },
      applications: {
        total: totalApplications,
        byStage: stageCounts,
      },
      emails: {
        counts: emailStatusCounts,
        recent: recentEmailLogs,
      },
      recentActivity: recentAuditLogs,
      noDataForPeriod: noData,
      emptyMessage: noData ? 'No data is available for this reporting period.' : null,
    };
  }

  // ==========================================
  // A03: USER MANAGEMENT
  // ==========================================
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    pathway?: Pathway;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }
    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;
    if (params.pathway) where.activePathway = params.pathway;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          activePathway: true,
          hasCompletedAssessment: true,
          isEmailVerified: true,
          createdAt: true,
          lastAssessmentCompletedAt: true,
          commonProfile: {
            select: {
              locationCountry: true,
              highestQualification: true,
              fieldOfStudy: true,
              profileCompletion: true,
            },
          },
          _count: {
            select: {
              applications: true,
              savedOpportunities: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(
    userId: string,
    status: UserStatus,
    adminId: string,
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundException('User not found.');

    if (targetUser.role === UserRole.SUPER_ADMIN && status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Cannot suspend a Super Admin account.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        role: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_STATUS_UPDATED',
        entityType: 'User',
        entityId: userId,
        payload: { oldStatus: targetUser.status, newStatus: status, userEmail: targetUser.email },
        ipAddress,
      },
    });

    return updated;
  }

  async updateUserRole(
    userId: string,
    newRole: UserRole,
    adminUser: { id: string; role: UserRole },
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundException('User not found.');

    if (adminUser.id === userId && newRole === UserRole.USER) {
      throw new BadRequestException('You cannot revoke your own administrator access.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'USER_ROLE_UPDATED',
        entityType: 'User',
        entityId: userId,
        payload: { oldRole: targetUser.role, newRole, userEmail: targetUser.email },
        ipAddress,
      },
    });

    return updated;
  }

  async updateUserDetails(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      activePathway?: Pathway;
      isEmailVerified?: boolean;
    },
    adminId: string,
    ipAddress?: string,
  ) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundException('User not found.');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName.trim() } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName.trim() } : {}),
        ...(data.activePathway !== undefined ? { activePathway: data.activePathway } : {}),
        ...(data.isEmailVerified !== undefined ? { isEmailVerified: Boolean(data.isEmailVerified) } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_DETAILS_UPDATED',
        entityType: 'User',
        entityId: userId,
        payload: { updatedFields: data, userEmail: targetUser.email },
        ipAddress,
      },
    });

    return updated;
  }

  async deleteUser(userId: string, adminId: string, ipAddress?: string) {
    const targetUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new NotFoundException('User not found.');

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete a Super Admin account.');
    }

    if (targetUser.id === adminId) {
      throw new BadRequestException('You cannot delete your own account.');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_ACCOUNT_DELETED',
        entityType: 'User',
        entityId: userId,
        payload: { deletedEmail: targetUser.email },
        ipAddress,
      },
    });

    return { success: true, message: `User account ${targetUser.email} permanently removed.` };
  }

  async bulkDeleteUsers(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No user IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.deleteUser(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`User ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  // ==========================================
  // A04, A05, A06: OPPORTUNITIES CRUD
  // ==========================================
  async getOpportunities(params: {
    page?: number;
    limit?: number;
    search?: string;
    opportunityType?: OpportunityType;
    status?: OpportunityStatus;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q } },
        { organization: { contains: q } },
        { country: { contains: q } },
        { referenceCode: { contains: q } },
      ];
    }
    if (params.opportunityType) where.opportunityType = params.opportunityType;
    if (params.status) where.status = params.status;

    const [opportunities, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          employmentDetail: true,
          scholarshipDetail: true,
          _count: {
            select: {
              savedByUsers: true,
              applications: true,
            },
          },
        },
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return {
      opportunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createOpportunity(dto: CreateOpportunityDto, adminId: string, ipAddress?: string) {
    let referenceCode = dto.referenceCode;
    if (!referenceCode) {
      const prefix = dto.opportunityType === OpportunityType.EMPLOYMENT ? 'EMP' : 'SCH';
      const count = await this.prisma.opportunity.count({
        where: { opportunityType: dto.opportunityType },
      });
      referenceCode = `${prefix}-${String(count + 1).padStart(4, '0')}`;
    }

    const created = await this.prisma.opportunity.create({
      data: {
        referenceCode,
        opportunityType: dto.opportunityType,
        title: dto.title,
        organization: dto.organization,
        country: dto.country,
        location: dto.location,
        status: dto.status || OpportunityStatus.PUBLISHED,
        openingDate: dto.openingDate ? new Date(dto.openingDate) : null,
        deadline: new Date(dto.deadline),
        applicationUrl: dto.applicationUrl,
        sourceUrl: dto.sourceUrl || dto.applicationUrl,
        overview: dto.overview,
        requirements: dto.requirements,
        isFeatured: dto.isFeatured || false,
        employmentDetail:
          dto.opportunityType === OpportunityType.EMPLOYMENT && dto.employmentDetail
            ? {
                create: {
                  subType: dto.employmentDetail.subType || 'Full-time',
                  sector: dto.employmentDetail.sector,
                  function: dto.employmentDetail.function,
                  workArrangement: dto.employmentDetail.workArrangement || WorkArrangement.ONSITE,
                  experienceLevel: dto.employmentDetail.experienceLevel || 'Entry',
                  minimumEducation: dto.employmentDetail.minimumEducation || 'Bachelor',
                  eligibleNationalities: dto.employmentDetail.eligibleNationalities || ['Any'],
                  requiredSkills: dto.employmentDetail.requiredSkills || [],
                  compensationRange: dto.employmentDetail.compensationRange,
                },
              }
            : undefined,
        scholarshipDetail:
          dto.opportunityType === OpportunityType.SCHOLARSHIP && dto.scholarshipDetail
            ? {
                create: {
                  studyLevels: dto.scholarshipDetail.studyLevels || ["Master's"],
                  eligibleNationalities: dto.scholarshipDetail.eligibleNationalities || ['All'],
                  eligibleFields: dto.scholarshipDetail.eligibleFields || ['All Fields'],
                  academicRequirement: dto.scholarshipDetail.academicRequirement,
                  experienceRequirement: dto.scholarshipDetail.experienceRequirement,
                  fundingLevel: dto.scholarshipDetail.fundingLevel || FundingLevel.FULLY_FUNDED,
                  languageRequirement: dto.scholarshipDetail.languageRequirement,
                  programStartYear: dto.scholarshipDetail.programStartYear,
                },
              }
            : undefined,
      },
      include: {
        employmentDetail: true,
        scholarshipDetail: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'OPPORTUNITY_CREATED',
        entityType: 'Opportunity',
        entityId: created.id,
        payload: { referenceCode, title: dto.title, type: dto.opportunityType },
        ipAddress,
      },
    });

    return created;
  }

  async updateOpportunity(
    id: string,
    dto: UpdateOpportunityDto,
    adminId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Opportunity not found.');

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: {
        title: dto.title,
        organization: dto.organization,
        country: dto.country,
        location: dto.location,
        status: dto.status,
        openingDate: dto.openingDate ? new Date(dto.openingDate) : null,
        deadline: new Date(dto.deadline),
        applicationUrl: dto.applicationUrl,
        sourceUrl: dto.sourceUrl,
        overview: dto.overview,
        requirements: dto.requirements,
        isFeatured: dto.isFeatured,
        lastVerifiedAt: new Date(),
        employmentDetail:
          dto.opportunityType === OpportunityType.EMPLOYMENT && dto.employmentDetail
            ? {
                upsert: {
                  create: {
                    subType: dto.employmentDetail.subType || 'Full-time',
                    sector: dto.employmentDetail.sector,
                    function: dto.employmentDetail.function,
                    workArrangement: dto.employmentDetail.workArrangement || WorkArrangement.ONSITE,
                    experienceLevel: dto.employmentDetail.experienceLevel || 'Entry',
                    minimumEducation: dto.employmentDetail.minimumEducation || 'Bachelor',
                    eligibleNationalities: dto.employmentDetail.eligibleNationalities || ['Any'],
                    requiredSkills: dto.employmentDetail.requiredSkills || [],
                    compensationRange: dto.employmentDetail.compensationRange,
                  },
                  update: {
                    subType: dto.employmentDetail.subType,
                    sector: dto.employmentDetail.sector,
                    function: dto.employmentDetail.function,
                    workArrangement: dto.employmentDetail.workArrangement,
                    experienceLevel: dto.employmentDetail.experienceLevel,
                    minimumEducation: dto.employmentDetail.minimumEducation,
                    eligibleNationalities: dto.employmentDetail.eligibleNationalities,
                    requiredSkills: dto.employmentDetail.requiredSkills,
                    compensationRange: dto.employmentDetail.compensationRange,
                  },
                },
              }
            : undefined,
        scholarshipDetail:
          dto.opportunityType === OpportunityType.SCHOLARSHIP && dto.scholarshipDetail
            ? {
                upsert: {
                  create: {
                    studyLevels: dto.scholarshipDetail.studyLevels || ["Master's"],
                    eligibleNationalities: dto.scholarshipDetail.eligibleNationalities || ['All'],
                    eligibleFields: dto.scholarshipDetail.eligibleFields || ['All Fields'],
                    academicRequirement: dto.scholarshipDetail.academicRequirement,
                    experienceRequirement: dto.scholarshipDetail.experienceRequirement,
                    fundingLevel: dto.scholarshipDetail.fundingLevel || FundingLevel.FULLY_FUNDED,
                    languageRequirement: dto.scholarshipDetail.languageRequirement,
                    programStartYear: dto.scholarshipDetail.programStartYear,
                  },
                  update: {
                    studyLevels: dto.scholarshipDetail.studyLevels,
                    eligibleNationalities: dto.scholarshipDetail.eligibleNationalities,
                    eligibleFields: dto.scholarshipDetail.eligibleFields,
                    academicRequirement: dto.scholarshipDetail.academicRequirement,
                    experienceRequirement: dto.scholarshipDetail.experienceRequirement,
                    fundingLevel: dto.scholarshipDetail.fundingLevel,
                    languageRequirement: dto.scholarshipDetail.languageRequirement,
                    programStartYear: dto.scholarshipDetail.programStartYear,
                  },
                },
              }
            : undefined,
      },
      include: {
        employmentDetail: true,
        scholarshipDetail: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'OPPORTUNITY_UPDATED',
        entityType: 'Opportunity',
        entityId: id,
        payload: { referenceCode: existing.referenceCode, title: dto.title },
        ipAddress,
      },
    });

    return updated;
  }

  async updateOpportunityStatus(
    id: string,
    status: OpportunityStatus,
    adminId: string,
    ipAddress?: string,
  ) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new NotFoundException('Opportunity not found.');

    const updated = await this.prisma.opportunity.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'OPPORTUNITY_STATUS_CHANGED',
        entityType: 'Opportunity',
        entityId: id,
        payload: {
          referenceCode: opp.referenceCode,
          oldStatus: opp.status,
          newStatus: status,
        },
        ipAddress,
      },
    });

    return updated;
  }

  async deleteOpportunity(id: string, adminId: string, ipAddress?: string) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { _count: { select: { applications: true, savedByUsers: true } } },
    });
    if (!opp) throw new NotFoundException('Opportunity not found.');

    if (opp._count.applications > 0 || opp._count.savedByUsers > 0) {
      await this.prisma.opportunity.update({
        where: { id },
        data: { status: OpportunityStatus.ARCHIVED },
      });
    } else {
      await this.prisma.opportunity.delete({ where: { id } });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'OPPORTUNITY_DELETED',
        entityType: 'Opportunity',
        entityId: id,
        payload: { referenceCode: opp.referenceCode, title: opp.title },
        ipAddress,
      },
    });

    return { success: true };
  }

  async bulkDeleteOpportunities(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No opportunity IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.deleteOpportunity(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Opportunity ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  // ==========================================
  // A07: BULK IMPORTER
  // ==========================================
  async parseRawFileToRows(buffer: Buffer, filename: string): Promise<any[]> {
    const isCsv = filename.toLowerCase().endsWith('.csv');
    const isXlsx = filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls');

    if (isCsv) {
      const records = parseCsv(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      return records;
    } else if (isXlsx) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return [];

      const rows: any[] = [];
      const headers: string[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').trim();
          });
        } else {
          const rowObj: Record<string, any> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              rowObj[header] = cell.value;
            }
          });
          if (Object.keys(rowObj).length > 0) {
            rows.push(rowObj);
          }
        }
      });
      return rows;
    } else {
      throw new BadRequestException('Unsupported file format. Please upload a .csv or .xlsx file.');
    }
  }

  validateImportRow(row: any, index: number, expectedType?: OpportunityType): { valid: boolean; errors: string[]; parsed?: any } {
    const errors: string[] = [];
    const getVal = (field: string) => {
      const val = row[field] ?? row[field.toLowerCase()] ?? row[field.toUpperCase()];
      return typeof val === 'string' ? val.trim() : val;
    };

    let typeRaw = String(getVal('opportunityType') || getVal('type') || '').toUpperCase();
    if (!typeRaw && expectedType) {
      typeRaw = expectedType;
    }

    const isEmployment = typeRaw === 'EMPLOYMENT' || typeRaw === 'JOB' || typeRaw === 'CAREER';
    const isScholarship = typeRaw === 'SCHOLARSHIP' || typeRaw === 'EDUCATION';

    if (!isEmployment && !isScholarship) {
      errors.push("Invalid opportunityType: must be 'EMPLOYMENT' or 'SCHOLARSHIP'");
    }

    if (expectedType) {
      if (expectedType === OpportunityType.EMPLOYMENT && !isEmployment) {
        errors.push(`Invalid type: This import is restricted to Career & Employment opportunities.`);
      } else if (expectedType === OpportunityType.SCHOLARSHIP && !isScholarship) {
        errors.push(`Invalid type: This import is restricted to Education & Scholarship opportunities.`);
      }
    }

    const title = getVal('title');
    if (!title) errors.push('Title is required');

    const organization = getVal('organization') || getVal('company') || getVal('institution');
    if (!organization) errors.push('Organization/Employer is required');

    const country = getVal('country');
    if (!country) errors.push('Country is required');

    const location = getVal('location') || 'Global';

    const deadlineRaw = getVal('deadline');
    let deadline: Date | null = null;
    if (!deadlineRaw) {
      errors.push('Deadline is required');
    } else {
      const parsedDate = new Date(deadlineRaw);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Invalid deadline date format: "${deadlineRaw}"`);
      } else {
        deadline = parsedDate;
      }
    }

    const applicationUrl = getVal('applicationUrl') || getVal('url') || getVal('link');
    if (!applicationUrl) {
      errors.push('Official applicationUrl is required');
    }

    const overview = getVal('overview') || getVal('description') || 'No description provided.';
    const requirements = getVal('requirements') || 'See official application link.';

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const parsed: any = {
      opportunityType: isEmployment ? OpportunityType.EMPLOYMENT : OpportunityType.SCHOLARSHIP,
      title,
      organization,
      country,
      location,
      deadline,
      applicationUrl,
      sourceUrl: getVal('sourceUrl') || applicationUrl,
      overview,
      requirements,
      referenceCode: getVal('referenceCode') || undefined,
    };

    if (isEmployment) {
      let workArrangement: WorkArrangement = WorkArrangement.ONSITE;
      const waRaw = String(getVal('workArrangement') || '').toUpperCase();
      if (waRaw === 'REMOTE') workArrangement = WorkArrangement.REMOTE;
      else if (waRaw === 'HYBRID') workArrangement = WorkArrangement.HYBRID;
      else if (waRaw === 'ANY') workArrangement = WorkArrangement.ANY;

      const skillsRaw = getVal('requiredSkills') || getVal('skills');
      const requiredSkills = Array.isArray(skillsRaw)
        ? skillsRaw
        : typeof skillsRaw === 'string'
        ? skillsRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
        : [];

      parsed.employmentDetail = {
        subType: getVal('subType') || 'Full-time',
        sector: getVal('sector') || 'Technology & Software',
        function: getVal('function') || 'Software Engineering',
        workArrangement,
        experienceLevel: getVal('experienceLevel') || 'Entry',
        minimumEducation: getVal('minimumEducation') || 'Bachelor',
        eligibleNationalities: ['Any'],
        requiredSkills,
        compensationRange: getVal('compensationRange') || undefined,
      };
    } else {
      let fundingLevel: FundingLevel = FundingLevel.FULLY_FUNDED;
      const flRaw = String(getVal('fundingLevel') || '').toUpperCase();
      if (flRaw.includes('PARTIAL')) fundingLevel = FundingLevel.PARTIAL_TUITION;
      else if (flRaw.includes('STIPEND')) fundingLevel = FundingLevel.STIPEND_ONLY;
      else if (flRaw.includes('VARIABLE')) fundingLevel = FundingLevel.VARIABLE;

      const levelsRaw = getVal('studyLevels') || getVal('levels');
      const studyLevels = Array.isArray(levelsRaw)
        ? levelsRaw
        : typeof levelsRaw === 'string'
        ? levelsRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
        : ["Master's"];

      const fieldsRaw = getVal('eligibleFields') || getVal('fields');
      const eligibleFields = Array.isArray(fieldsRaw)
        ? fieldsRaw
        : typeof fieldsRaw === 'string'
        ? fieldsRaw.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
        : ['All Fields'];

      parsed.scholarshipDetail = {
        studyLevels,
        eligibleNationalities: ['All'],
        eligibleFields,
        academicRequirement: getVal('academicRequirement') || 'First Class or 2:1 equivalent',
        experienceRequirement: getVal('experienceRequirement') || undefined,
        fundingLevel,
        languageRequirement: getVal('languageRequirement') || undefined,
        programStartYear: Number(getVal('programStartYear')) || new Date().getFullYear() + 1,
      };
    }

    return { valid: true, errors: [], parsed };
  }

  /**
   * Generates sample opportunity import templates in CSV or Excel XLSX format
   */
  async generateImportTemplate(
    type: OpportunityType,
    format: 'csv' | 'xlsx',
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const isEmployment = type === OpportunityType.EMPLOYMENT;

    const employmentColumns = [
      { header: 'opportunityType', key: 'opportunityType', width: 18 },
      { header: 'title', key: 'title', width: 36 },
      { header: 'organization', key: 'organization', width: 28 },
      { header: 'country', key: 'country', width: 18 },
      { header: 'location', key: 'location', width: 18 },
      { header: 'deadline', key: 'deadline', width: 15 },
      { header: 'applicationUrl', key: 'applicationUrl', width: 35 },
      { header: 'sourceUrl', key: 'sourceUrl', width: 35 },
      { header: 'overview', key: 'overview', width: 45 },
      { header: 'requirements', key: 'requirements', width: 45 },
      { header: 'workArrangement', key: 'workArrangement', width: 18 },
      { header: 'subType', key: 'subType', width: 16 },
      { header: 'sector', key: 'sector', width: 24 },
      { header: 'function', key: 'function', width: 24 },
      { header: 'experienceLevel', key: 'experienceLevel', width: 18 },
      { header: 'minimumEducation', key: 'minimumEducation', width: 18 },
      { header: 'skills', key: 'skills', width: 35 },
      { header: 'compensationRange', key: 'compensationRange', width: 24 },
    ];

    const employmentSampleRows = [
      {
        opportunityType: 'EMPLOYMENT',
        title: 'Senior Distributed Database Engineer',
        organization: 'Sterling Global Tech',
        country: 'United Kingdom',
        location: 'London',
        deadline: '2027-04-30',
        applicationUrl: 'https://sterling.example.com/apply',
        sourceUrl: 'https://sterling.example.com/verify',
        overview: 'Build high throughput cloud database clusters',
        requirements: '5+ years backend systems and MySQL experience',
        workArrangement: 'HYBRID',
        subType: 'Full-time',
        sector: 'Technology & Software',
        function: 'Software Engineering',
        experienceLevel: 'Senior',
        minimumEducation: 'Bachelor',
        skills: 'Go, MySQL, Distributed Systems, Redis',
        compensationRange: '£85000 - £100000',
      },
      {
        opportunityType: 'EMPLOYMENT',
        title: 'Commercial Banking Associate',
        organization: 'Sterling Financial Services',
        country: 'Nigeria',
        location: 'Lagos',
        deadline: '2027-03-15',
        applicationUrl: 'https://bank.example.com/careers',
        sourceUrl: 'https://bank.example.com/announcement',
        overview: 'Manage corporate client relationships and loan portfolios',
        requirements: '2 years corporate banking and financial modeling',
        workArrangement: 'ONSITE',
        subType: 'Full-time',
        sector: 'Financial Services',
        function: 'Commercial Banking',
        experienceLevel: 'Mid',
        minimumEducation: 'Bachelor',
        skills: 'Financial Modeling, Risk Analysis, Negotiation',
        compensationRange: '₦12000000 - ₦15000000',
      },
    ];

    const scholarshipColumns = [
      { header: 'opportunityType', key: 'opportunityType', width: 18 },
      { header: 'title', key: 'title', width: 38 },
      { header: 'organization', key: 'organization', width: 28 },
      { header: 'country', key: 'country', width: 18 },
      { header: 'location', key: 'location', width: 18 },
      { header: 'deadline', key: 'deadline', width: 15 },
      { header: 'applicationUrl', key: 'applicationUrl', width: 35 },
      { header: 'sourceUrl', key: 'sourceUrl', width: 35 },
      { header: 'overview', key: 'overview', width: 45 },
      { header: 'requirements', key: 'requirements', width: 45 },
      { header: 'fundingLevel', key: 'fundingLevel', width: 18 },
      { header: 'studyLevels', key: 'studyLevels', width: 20 },
      { header: 'eligibleNationalities', key: 'eligibleNationalities', width: 24 },
      { header: 'eligibleFields', key: 'eligibleFields', width: 35 },
      { header: 'academicRequirement', key: 'academicRequirement', width: 30 },
      { header: 'experienceRequirement', key: 'experienceRequirement', width: 28 },
      { header: 'languageRequirement', key: 'languageRequirement', width: 22 },
      { header: 'programStartYear', key: 'programStartYear', width: 18 },
    ];

    const scholarshipSampleRows = [
      {
        opportunityType: 'SCHOLARSHIP',
        title: 'Sterling International Academic Fellowship',
        organization: 'Sterling Trust',
        country: 'Global',
        location: 'Oxford',
        deadline: '2027-05-15',
        applicationUrl: 'https://trust.example.org/apply',
        sourceUrl: 'https://trust.example.org/details',
        overview: 'Fully funded postgraduate award for emerging researchers across global universities',
        requirements: 'Demonstrated leadership and academic distinction',
        fundingLevel: 'FULLY_FUNDED',
        studyLevels: "Master's, PhD",
        eligibleNationalities: 'All Nationalities',
        eligibleFields: 'All Fields, STEM, Social Sciences',
        academicRequirement: 'First Class Honours or 2:1 equivalent',
        experienceRequirement: '2 years professional experience',
        languageRequirement: 'IELTS 7.0 or equivalent',
        programStartYear: '2027',
      },
      {
        opportunityType: 'SCHOLARSHIP',
        title: 'Global Leadership Graduate Award',
        organization: 'Commonwealth Academic Board',
        country: 'United Kingdom',
        location: 'London',
        deadline: '2027-06-30',
        applicationUrl: 'https://cw.example.org/apply',
        sourceUrl: 'https://cw.example.org/awards',
        overview: 'Tuition fee waiver and living stipend for Commonwealth scholars',
        requirements: 'Outstanding scholastic record and civic contribution',
        fundingLevel: 'PARTIAL_TUITION',
        studyLevels: "Master's",
        eligibleNationalities: 'Commonwealth Countries',
        eligibleFields: 'Public Policy, Economics, Climate Science',
        academicRequirement: '3.5+ GPA or equivalent',
        experienceRequirement: 'None required',
        languageRequirement: 'IELTS 6.5',
        programStartYear: '2027',
      },
    ];

    const columns = isEmployment ? employmentColumns : scholarshipColumns;
    const sampleRows = isEmployment ? employmentSampleRows : scholarshipSampleRows;

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sterling Connect';
      const worksheet = workbook.addWorksheet(
        isEmployment ? 'Employment Opportunities' : 'Scholarship Opportunities',
      );

      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width,
      }));

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEmployment ? 'FF102641' : 'FF087B63' },
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 26;

      sampleRows.forEach((r) => {
        const row = worksheet.addRow(r);
        row.alignment = { vertical: 'middle' };
      });

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      return {
        buffer,
        filename: isEmployment
          ? 'sterling_employment_opportunities_template.xlsx'
          : 'sterling_scholarship_opportunities_template.xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } else {
      const headerLine = columns.map((c) => c.header).join(',');
      const rowLines = sampleRows.map((r: any) =>
        columns
          .map((c) => {
            const val = String(r[c.key] ?? '');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(','),
      );
      const csvString = [headerLine, ...rowLines].join('\n');
      return {
        buffer: Buffer.from(csvString, 'utf-8'),
        filename: isEmployment
          ? 'sterling_employment_opportunities_template.csv'
          : 'sterling_scholarship_opportunities_template.csv',
        mimeType: 'text/csv; charset=utf-8',
      };
    }
  }

  async previewBulkImport(buffer: Buffer, filename: string, expectedType?: OpportunityType) {
    const rawRows = await this.parseRawFileToRows(buffer, filename);
    const validRows: any[] = [];
    const errors: { rowNumber: number; referenceCode?: string; field?: string; message: string }[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const validation = this.validateImportRow(row, rowNum, expectedType);
      if (validation.valid && validation.parsed) {
        validRows.push({ ...validation.parsed, _rowNumber: rowNum });
      } else {
        validation.errors.forEach((msg) => {
          errors.push({
            rowNumber: rowNum,
            referenceCode: row.referenceCode,
            message: msg,
          });
        });
      }
    });

    return {
      totalRows: rawRows.length,
      validCount: validRows.length,
      invalidCount: rawRows.length - validRows.length,
      validRows,
      errors,
      expectedType,
      summaryMessage: `${validRows.length} valid rows. ${rawRows.length - validRows.length} rows need attention. No invalid rows will be imported.`,
    };
  }

  async commitBulkImport(validRows: any[], adminId: string, ipAddress?: string) {
    if (!validRows || validRows.length === 0) {
      throw new BadRequestException('No valid rows provided for import.');
    }

    let importedCount = 0;
    let empCount = await this.prisma.opportunity.count({
      where: { opportunityType: OpportunityType.EMPLOYMENT },
    });
    let schCount = await this.prisma.opportunity.count({
      where: { opportunityType: OpportunityType.SCHOLARSHIP },
    });

    for (const row of validRows) {
      let refCode = row.referenceCode;
      if (!refCode) {
        if (row.opportunityType === OpportunityType.EMPLOYMENT) {
          empCount++;
          refCode = `EMP-${String(empCount).padStart(4, '0')}`;
        } else {
          schCount++;
          refCode = `SCH-${String(schCount).padStart(4, '0')}`;
        }
      }

      await this.prisma.opportunity.create({
        data: {
          referenceCode: refCode,
          opportunityType: row.opportunityType,
          title: row.title,
          organization: row.organization,
          country: row.country,
          location: row.location || 'Global',
          status: OpportunityStatus.PUBLISHED,
          openingDate: row.openingDate ? new Date(row.openingDate) : new Date(),
          deadline: new Date(row.deadline),
          applicationUrl: row.applicationUrl,
          sourceUrl: row.sourceUrl || row.applicationUrl,
          overview: row.overview,
          requirements: row.requirements,
          isFeatured: Boolean(row.isFeatured),
          employmentDetail:
            row.opportunityType === OpportunityType.EMPLOYMENT && row.employmentDetail
              ? {
                  create: {
                    subType: row.employmentDetail.subType || 'Full-time',
                    sector: row.employmentDetail.sector,
                    function: row.employmentDetail.function,
                    workArrangement: row.employmentDetail.workArrangement || WorkArrangement.ONSITE,
                    experienceLevel: row.employmentDetail.experienceLevel || 'Entry',
                    minimumEducation: row.employmentDetail.minimumEducation || 'Bachelor',
                    eligibleNationalities: row.employmentDetail.eligibleNationalities || ['Any'],
                    requiredSkills: row.employmentDetail.requiredSkills || [],
                    compensationRange: row.employmentDetail.compensationRange,
                  },
                }
              : undefined,
          scholarshipDetail:
            row.opportunityType === OpportunityType.SCHOLARSHIP && row.scholarshipDetail
              ? {
                  create: {
                    studyLevels: row.scholarshipDetail.studyLevels || ["Master's"],
                    eligibleNationalities: row.scholarshipDetail.eligibleNationalities || ['All'],
                    eligibleFields: row.scholarshipDetail.eligibleFields || ['All Fields'],
                    academicRequirement: row.scholarshipDetail.academicRequirement,
                    experienceRequirement: row.scholarshipDetail.experienceRequirement,
                    fundingLevel: row.scholarshipDetail.fundingLevel || FundingLevel.FULLY_FUNDED,
                    languageRequirement: row.scholarshipDetail.languageRequirement,
                    programStartYear: row.scholarshipDetail.programStartYear,
                  },
                }
              : undefined,
        },
      });

      importedCount++;
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'OPPORTUNITIES_BULK_IMPORTED',
        entityType: 'Opportunity',
        payload: { count: importedCount },
        ipAddress,
      },
    });

    return {
      success: true,
      importedCount,
      message: `Successfully imported ${importedCount} opportunities into the repository.`,
    };
  }

  // ==========================================
  // A08: ASSESSMENT VERSIONS
  // ==========================================
  async getAssessmentVersions() {
    const versions = await this.prisma.assessmentVersion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    return {
      versions,
      instruction: 'Published versions remain attached to historical submissions.',
      note: 'Publishing this version changes future assessments. Existing completed results will be preserved.',
    };
  }

  async getAssessmentVersionById(id: string) {
    const version = await this.prisma.assessmentVersion.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: [{ categoryId: 'asc' }, { orderInCategory: 'asc' }],
        },
        _count: {
          select: { attempts: true, questions: true },
        },
      },
    });
    if (!version) throw new NotFoundException('Assessment version not found.');
    return version;
  }

  async createDraftAssessmentVersion(title: string, adminId: string, ipAddress?: string) {
    const versions = await this.prisma.assessmentVersion.findMany();
    const nextVersionNum = `${versions.length + 1}.0`;

    const newVersion = await this.prisma.assessmentVersion.create({
      data: {
        versionNumber: nextVersionNum,
        title: title || `Sterling Universal Diagnostic v${nextVersionNum}`,
        status: AssessmentVersionStatus.DRAFT,
      },
    });

    // Copy questions from published version if exists
    const currentPublished = await this.prisma.assessmentVersion.findFirst({
      where: { status: AssessmentVersionStatus.PUBLISHED },
      include: { questions: true },
    });

    if (currentPublished && currentPublished.questions.length > 0) {
      await this.prisma.assessmentQuestion.createMany({
        data: currentPublished.questions.map((q) => ({
          versionId: newVersion.id,
          questionCode: q.questionCode,
          categoryId: q.categoryId,
          categoryName: q.categoryName,
          orderIndex: q.orderIndex,
          orderInCategory: q.orderInCategory,
          statement: q.statement,
          construct: q.construct,
          isActive: true,
        })),
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_DRAFT_VERSION_CREATED',
        entityType: 'AssessmentVersion',
        entityId: newVersion.id,
        payload: { versionNumber: nextVersionNum },
        ipAddress,
      },
    });

    return newVersion;
  }

  async publishAssessmentVersion(versionId: string, adminId: string, ipAddress?: string) {
    const target = await this.prisma.assessmentVersion.findUnique({ where: { id: versionId } });
    if (!target) throw new NotFoundException('Assessment version not found.');

    // Archive previous published
    await this.prisma.assessmentVersion.updateMany({
      where: { status: AssessmentVersionStatus.PUBLISHED },
      data: { status: AssessmentVersionStatus.ARCHIVED },
    });

    // Publish target
    const published = await this.prisma.assessmentVersion.update({
      where: { id: versionId },
      data: { status: AssessmentVersionStatus.PUBLISHED },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_VERSION_PUBLISHED',
        entityType: 'AssessmentVersion',
        entityId: versionId,
        payload: { versionNumber: target.versionNumber },
        ipAddress,
      },
    });

    return {
      published,
      message: 'Publishing this version changes future assessments. Existing completed results will be preserved.',
    };
  }

  async updateAssessmentVersion(id: string, title: string, adminId: string, ipAddress?: string) {
    const version = await this.prisma.assessmentVersion.findUnique({ where: { id } });
    if (!version) throw new NotFoundException('Assessment version not found.');

    const updated = await this.prisma.assessmentVersion.update({
      where: { id },
      data: { title: title.trim() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_VERSION_UPDATED',
        entityType: 'AssessmentVersion',
        entityId: id,
        payload: { title },
        ipAddress,
      },
    });

    return updated;
  }

  async deleteAssessmentVersion(id: string, adminId: string, ipAddress?: string) {
    const version = await this.prisma.assessmentVersion.findUnique({
      where: { id },
      include: { _count: { select: { attempts: true } } },
    });
    if (!version) throw new NotFoundException('Assessment version not found.');

    if (version.status === AssessmentVersionStatus.PUBLISHED) {
      throw new BadRequestException('Cannot delete an active published assessment version.');
    }

    if (version._count.attempts > 0) {
      throw new BadRequestException(
        'Cannot delete an assessment version that has completed candidate attempts attached.',
      );
    }

    await this.prisma.assessmentVersion.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_VERSION_DELETED',
        entityType: 'AssessmentVersion',
        entityId: id,
        payload: { versionNumber: version.versionNumber },
        ipAddress,
      },
    });

    return { success: true, message: `Assessment version v${version.versionNumber} deleted.` };
  }

  async bulkDeleteAssessmentVersions(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No assessment version IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.deleteAssessmentVersion(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Version ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  async updateAssessmentQuestion(
    questionId: string,
    data: { statement?: string; construct?: string; isActive?: boolean },
    adminId: string,
    ipAddress?: string,
  ) {
    const q = await this.prisma.assessmentQuestion.findUnique({ where: { id: questionId } });
    if (!q) throw new NotFoundException('Diagnostic question item not found.');

    const updated = await this.prisma.assessmentQuestion.update({
      where: { id: questionId },
      data: {
        ...(data.statement ? { statement: data.statement.trim() } : {}),
        ...(data.construct ? { construct: data.construct.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_QUESTION_UPDATED',
        entityType: 'AssessmentQuestion',
        entityId: questionId,
        payload: { questionCode: q.questionCode, ...data },
        ipAddress,
      },
    });

    return updated;
  }

  async createAssessmentQuestion(
    versionId: string,
    dto: {
      categoryId: string;
      questionCode: string;
      statement: string;
      construct?: string;
      orderInCategory?: number;
    },
    adminId: string,
    ipAddress?: string,
  ) {
    const version = await this.prisma.assessmentVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new NotFoundException('Assessment version not found.');

    if (version.status === AssessmentVersionStatus.PUBLISHED) {
      throw new BadRequestException('Cannot add items to an active published version. Create a draft version instead.');
    }

    const category = await this.prisma.academyCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException(`Diagnostic category ${dto.categoryId} not found.`);

    const code = dto.questionCode.trim().toUpperCase();
    const existing = await this.prisma.assessmentQuestion.findUnique({
      where: {
        versionId_questionCode: {
          versionId,
          questionCode: code,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(`Question code "${code}" already exists in this version.`);
    }

    const count = await this.prisma.assessmentQuestion.count({ where: { versionId } });

    const created = await this.prisma.assessmentQuestion.create({
      data: {
        versionId,
        categoryId: category.id,
        categoryName: category.name,
        questionCode: code,
        statement: dto.statement.trim(),
        construct: (dto.construct || 'Self-report capability').trim(),
        orderIndex: count + 1,
        orderInCategory: dto.orderInCategory || 1,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_QUESTION_CREATED',
        entityType: 'AssessmentQuestion',
        entityId: created.id,
        payload: { questionCode: created.questionCode, versionId },
        ipAddress,
      },
    });

    return created;
  }

  async deleteAssessmentQuestion(questionId: string, adminId: string, ipAddress?: string) {
    const q = await this.prisma.assessmentQuestion.findUnique({
      where: { id: questionId },
      include: {
        version: true,
        _count: { select: { responses: true } },
      },
    });
    if (!q) throw new NotFoundException('Diagnostic question item not found.');

    if (q.version.status === AssessmentVersionStatus.PUBLISHED) {
      throw new BadRequestException(
        'Cannot delete an item from an active published version. Deactivate it or create a new draft version.'
      );
    }

    if (q._count.responses > 0) {
      throw new BadRequestException(
        'Cannot delete a question item that has candidate responses attached. Deactivate it instead.'
      );
    }

    await this.prisma.assessmentQuestion.delete({ where: { id: questionId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ASSESSMENT_QUESTION_DELETED',
        entityType: 'AssessmentQuestion',
        entityId: questionId,
        payload: { questionCode: q.questionCode, versionId: q.versionId },
        ipAddress,
      },
    });

    return { success: true, message: `Question item ${q.questionCode} deleted.` };
  }

  // ==========================================
  // A09: RECOMMENDATION RULES
  // ==========================================
  async getRecommendationRules() {
    const rules = await this.prisma.recommendationRule.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const [courses, diagnosticCategories] = await Promise.all([
      this.sterlingCoursesService.getCourses(),
      this.prisma.academyCategory.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    return {
      rules,
      canonicalProducts: courses.map((c) => ({
        courseCode: c.courseCode,
        title: c.title,
        categoryId: c.categoryId,
        isFree: c.isFree,
        priceNGN: c.priceNGN,
      })),
      diagnosticDimensions: diagnosticCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
      })),
      instruction: 'Map dimensions and goals to canonical Academy products.',
    };
  }

  async createRecommendationRule(
    dto: { categoryId: string; readinessBand: string; courseCode: string; ruleName: string },
    adminId: string,
    ipAddress?: string,
  ) {
    const [courses, diagnosticCategories] = await Promise.all([
      this.sterlingCoursesService.getCourses(),
      this.prisma.academyCategory.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    const courseExists =
      courses.some((c) => c.courseCode === dto.courseCode || c.id === dto.courseCode) ||
      (await this.prisma.academyCourse.findUnique({ where: { courseCode: dto.courseCode } }));

    const catExists =
      diagnosticCategories.some((c) => c.id === dto.categoryId || c.name === dto.categoryId) ||
      (await this.prisma.academyCategory.findUnique({ where: { id: dto.categoryId } }));

    if (!catExists || !courseExists) {
      throw new BadRequestException(
        'This rule references a missing product or dimension. Correct it before activation.',
      );
    }

    const rule = await this.prisma.recommendationRule.create({
      data: {
        categoryId: dto.categoryId,
        readinessBand: dto.readinessBand,
        courseCode: dto.courseCode,
        ruleName: dto.ruleName,
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'RECOMMENDATION_RULE_CREATED',
        entityType: 'RecommendationRule',
        entityId: rule.id,
        payload: dto,
        ipAddress,
      },
    });

    return rule;
  }

  async toggleRecommendationRule(id: string, adminId: string, ipAddress?: string) {
    const rule = await this.prisma.recommendationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Recommendation rule not found.');

    const newActive = !rule.isActive;
    if (newActive) {
      const [courses, diagnosticCategories] = await Promise.all([
        this.sterlingCoursesService.getCourses(),
        this.prisma.academyCategory.findMany({
          orderBy: { displayOrder: 'asc' },
        }),
      ]);

      const courseExists =
        courses.some((c) => c.courseCode === rule.courseCode || c.id === rule.courseCode) ||
        (await this.prisma.academyCourse.findUnique({ where: { courseCode: rule.courseCode } }));

      const catExists =
        diagnosticCategories.some((c) => c.id === rule.categoryId || c.name === rule.categoryId) ||
        (await this.prisma.academyCategory.findUnique({ where: { id: rule.categoryId } }));

      if (!catExists || !courseExists) {
        throw new BadRequestException(
          'This rule references a missing product or dimension. Correct it before activation.',
        );
      }
    }

    const updated = await this.prisma.recommendationRule.update({
      where: { id },
      data: { isActive: newActive },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: newActive ? 'RECOMMENDATION_RULE_ACTIVATED' : 'RECOMMENDATION_RULE_DEACTIVATED',
        entityType: 'RecommendationRule',
        entityId: id,
        ipAddress,
      },
    });

    return updated;
  }

  async updateRecommendationRule(
    id: string,
    dto: { categoryId?: string; readinessBand?: string; courseCode?: string; ruleName?: string },
    adminId: string,
    ipAddress?: string,
  ) {
    const rule = await this.prisma.recommendationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Recommendation rule not found.');

    const targetCat = dto.categoryId || rule.categoryId;
    const targetCourse = dto.courseCode || rule.courseCode;

    const [courses, diagnosticCategories] = await Promise.all([
      this.sterlingCoursesService.getCourses(),
      this.prisma.academyCategory.findMany({
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    const courseExists =
      courses.some((c) => c.courseCode === targetCourse || c.id === targetCourse) ||
      (await this.prisma.academyCourse.findUnique({ where: { courseCode: targetCourse } }));

    const catExists =
      diagnosticCategories.some((c) => c.id === targetCat || c.name === targetCat) ||
      (await this.prisma.academyCategory.findUnique({ where: { id: targetCat } }));

    if (!catExists || !courseExists) {
      throw new BadRequestException(
        'This rule references a missing product or dimension. Correct it before activation.',
      );
    }

    const updated = await this.prisma.recommendationRule.update({
      where: { id },
      data: {
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.readinessBand ? { readinessBand: dto.readinessBand } : {}),
        ...(dto.courseCode ? { courseCode: dto.courseCode } : {}),
        ...(dto.ruleName ? { ruleName: dto.ruleName.trim() } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'RECOMMENDATION_RULE_UPDATED',
        entityType: 'RecommendationRule',
        entityId: id,
        payload: dto,
        ipAddress,
      },
    });

    return updated;
  }

  async deleteRecommendationRule(id: string, adminId: string, ipAddress?: string) {
    const rule = await this.prisma.recommendationRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Recommendation rule not found.');

    await this.prisma.recommendationRule.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'RECOMMENDATION_RULE_DELETED',
        entityType: 'RecommendationRule',
        entityId: id,
        payload: { ruleName: rule.ruleName },
        ipAddress,
      },
    });

    return { success: true, message: `Recommendation rule "${rule.ruleName}" deleted.` };
  }

  async bulkDeleteRecommendationRules(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No rule IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.deleteRecommendationRule(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Rule ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  // ==========================================
  // A10: MANAGE TAXONOMIES
  // ==========================================
  async getTaxonomies(type?: TaxonomyType) {
    const where: any = {};
    if (type) where.type = type;

    const items = await this.prisma.taxonomy.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { aliases: true },
    });

    return {
      items,
      instruction: 'Maintain sectors, functions, skills, study fields and approved relations.',
      deactivationRule: 'This option is referenced by existing records. Deactivate it rather than deleting it.',
    };
  }

  async addTaxonomyOption(
    dto: { type: TaxonomyType; code: string; name: string; aliases?: string[] },
    adminId: string,
    ipAddress?: string,
  ) {
    const name = (dto.name || (dto as any).label || '').trim();
    if (!name) throw new BadRequestException('Taxonomy name or label is required.');
    
    let type = dto.type || (dto as any).category;
    if (typeof type === 'string') {
      const upper = type.toUpperCase();
      if (upper === 'SKILLS' || upper === 'SKILL') type = TaxonomyType.SKILL;
      else if (upper === 'SECTORS' || upper === 'SECTOR' || upper === 'INDUSTRY_SECTOR') type = TaxonomyType.SECTOR;
      else if (upper === 'FUNCTIONS' || upper === 'FUNCTION' || upper === 'OCCUPATIONAL_FUNCTION') type = TaxonomyType.FUNCTION;
      else if (upper === 'STUDY_FIELDS' || upper === 'STUDY_FIELD') type = TaxonomyType.STUDY_FIELD;
      else if (upper === 'COUNTRY') type = TaxonomyType.COUNTRY;
      else if (upper === 'DEGREE_LEVEL') type = TaxonomyType.DEGREE_LEVEL;
    }

    const existing = await this.prisma.taxonomy.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException(`Taxonomy code "${dto.code}" already exists.`);

    const created = await this.prisma.taxonomy.create({
      data: {
        type: type as TaxonomyType,
        code: dto.code.trim().toUpperCase(),
        name,
        isActive: true,
        aliases: dto.aliases && dto.aliases.length > 0
          ? {
              create: dto.aliases.map((a: string) => ({ alias: a.trim() })),
            }
          : undefined,
      },
      include: {
        aliases: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'TAXONOMY_OPTION_ADDED',
        entityType: 'Taxonomy',
        entityId: created.id,
        payload: dto,
        ipAddress,
      },
    });

    return created;
  }

  async updateTaxonomyLabel(id: string, name: string, adminId: string, ipAddress?: string) {
    const updated = await this.prisma.taxonomy.update({
      where: { id },
      data: { name },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'TAXONOMY_LABEL_UPDATED',
        entityType: 'Taxonomy',
        entityId: id,
        payload: { name },
        ipAddress,
      },
    });

    return updated;
  }

  async addTaxonomyAlias(taxonomyId: string, alias: string, adminId: string, ipAddress?: string) {
    const created = await this.prisma.taxonomyAlias.create({
      data: {
        taxonomyId,
        alias: alias.trim(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'TAXONOMY_ALIAS_ADDED',
        entityType: 'TaxonomyAlias',
        entityId: created.id,
        payload: { taxonomyId, alias },
        ipAddress,
      },
    });

    return created;
  }

  async deactivateTaxonomyOption(id: string, adminId: string, ipAddress?: string) {
    const tax = await this.prisma.taxonomy.findUnique({ where: { id } });
    if (!tax) throw new NotFoundException('Taxonomy option not found.');

    const updated = await this.prisma.taxonomy.update({
      where: { id },
      data: { isActive: !tax.isActive },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: updated.isActive ? 'TAXONOMY_ACTIVATED' : 'TAXONOMY_DEACTIVATED',
        entityType: 'Taxonomy',
        entityId: id,
        ipAddress,
      },
    });

    return {
      updated,
      message: 'This option is referenced by existing records. Deactivate it rather than deleting it.',
    };
  }

  async deleteTaxonomyOption(id: string, adminId: string, ipAddress?: string) {
    const tax = await this.prisma.taxonomy.findUnique({
      where: { id },
      include: { aliases: true },
    });
    if (!tax) throw new NotFoundException('Taxonomy option not found.');

    // Check if referenced by existing employment or scholarship records
    const [empRefCount] = await Promise.all([
      this.prisma.employmentOpportunityDetail.count({
        where: {
          OR: [
            { sector: { contains: tax.name } },
            { function: { contains: tax.name } },
          ],
        },
      }),
    ]);

    if (empRefCount > 0) {
      throw new BadRequestException('This option is referenced by existing records. Deactivate it rather than deleting it.');
    }

    await this.prisma.taxonomy.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'TAXONOMY_OPTION_DELETED',
        entityType: 'Taxonomy',
        entityId: id,
        payload: { code: tax.code, name: tax.name },
        ipAddress,
      },
    });

    return { success: true, message: `Taxonomy option "${tax.name}" deleted.` };
  }

  async bulkDeleteTaxonomies(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No taxonomy IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.deleteTaxonomyOption(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Taxonomy ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  async deleteTaxonomyAlias(aliasId: string, adminId: string, ipAddress?: string) {
    const alias = await this.prisma.taxonomyAlias.findUnique({ where: { id: aliasId } });
    if (!alias) throw new NotFoundException('Taxonomy alias not found.');

    await this.prisma.taxonomyAlias.delete({ where: { id: aliasId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'TAXONOMY_ALIAS_DELETED',
        entityType: 'TaxonomyAlias',
        entityId: aliasId,
        payload: { alias: alias.alias },
        ipAddress,
      },
    });

    return { success: true, message: `Taxonomy alias "${alias.alias}" removed.` };
  }

  // ==========================================
  // A11: APPLICATIONS & OUTCOMES
  // ==========================================
  async getApplicationsAndOutcomes(params: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;

    const [applications, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          opportunity: {
            select: { id: true, referenceCode: true, title: true, organization: true, country: true },
          },
          statusHistory: {
            orderBy: { changedAt: 'desc' },
            take: 3,
          },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    return {
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      instruction: 'Review self-reported progress with appropriate access controls.',
      verificationNote: 'Reported outcomes are user declarations unless separately verified.',
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    status: any,
    notes?: string,
    adminId?: string,
    ipAddress?: string,
  ) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application record not found.');

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        ...(notes ? { notes: notes.trim() } : {}),
        statusHistory: {
          create: {
            fromStatus: app.status,
            toStatus: status,
            notes: notes ? `Admin override: ${notes.trim()}` : 'Updated by administrator.',
          },
        },
      },
    });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'APPLICATION_STATUS_UPDATED',
          entityType: 'Application',
          entityId: applicationId,
          payload: { oldStatus: app.status, newStatus: status, notes },
          ipAddress,
        },
      });
    }

    return updated;
  }

  async deleteApplication(applicationId: string, adminId: string, ipAddress?: string) {
    const app = await this.prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application record not found.');

    await this.prisma.application.delete({ where: { id: applicationId } });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'APPLICATION_DELETED',
        entityType: 'Application',
        entityId: applicationId,
        ipAddress,
      },
    });

    return { success: true, message: 'Application record removed.' };
  }

  async bulkDeleteApplications(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No application IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.deleteApplication(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Application ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  // ==========================================
  // A12: ANALYTICS & FUNNEL
  // ==========================================
  async getAnalytics() {
    const [
      totalUsers,
      readinessCompleted,
      totalSaved,
      totalApplied,
      totalShortlisted,
      totalInterview,
      totalOffers,
      totalAwarded,
      gaSetting,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { hasCompletedAssessment: true } }),
      this.prisma.application.count({ where: { status: 'SAVED' } }),
      this.prisma.application.count({ where: { status: { in: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'OFFER_SUCCESSFUL', 'AWARDED'] } } }),
      this.prisma.application.count({ where: { status: { in: ['SHORTLISTED', 'INTERVIEW', 'OFFER_SUCCESSFUL', 'AWARDED'] } } }),
      this.prisma.application.count({ where: { status: { in: ['INTERVIEW', 'OFFER_SUCCESSFUL', 'AWARDED'] } } }),
      this.prisma.application.count({ where: { status: { in: ['OFFER_SUCCESSFUL', 'AWARDED'] } } }),
      this.prisma.application.count({ where: { status: 'AWARDED' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'googleAnalytics' } }),
    ]);

    let googleAnalyticsConfig = {
      measurementId: this.config.get<string>('GA_MEASUREMENT_ID', 'G-8V6ZJ2E9X1'),
      propertyId: '438910291',
      streamName: 'SterlingConnect Production Web',
      enabled: true,
      lastUpdated: new Date().toISOString(),
    };

    if (gaSetting) {
      try {
        const parsed = JSON.parse(gaSetting.value);
        googleAnalyticsConfig = { ...googleAnalyticsConfig, ...parsed };
      } catch {
        // fallback
      }
    }

    const uniqueVisitorsEstimate = Math.max(86, totalUsers * 3 + 120);
    const totalPageViewsEstimate = Math.max(480, totalUsers * 16 + totalApplied * 22 + 650);

    return {
      funnel: [
        { stage: 'Registered Candidates', count: totalUsers, dropoff: '0%' },
        { stage: 'Readiness Gate Unlocked', count: readinessCompleted, dropoff: totalUsers > 0 ? `${Math.round(((totalUsers - readinessCompleted) / totalUsers) * 100)}%` : '0%' },
        { stage: 'Saved Opportunities', count: totalSaved, dropoff: '-' },
        { stage: 'Submitted Applications', count: totalApplied, dropoff: '-' },
        { stage: 'Shortlisted', count: totalShortlisted, dropoff: '-' },
        { stage: 'Interview Stage', count: totalInterview, dropoff: '-' },
        { stage: 'Received Offers', count: totalOffers, dropoff: '-' },
        { stage: 'Final Awarded Outcomes', count: totalAwarded, dropoff: '-' },
      ],
      eventRuleNotice: 'An opportunity click is not a submitted application. A learning click is not an enrolment.',
      googleAnalytics: {
        config: googleAnalyticsConfig,
      },
    };
  }

  // In-memory store for mutable email templates
  private emailTemplatesStore: any[] = [
    {
      id: 'EM002',
      name: 'EM002: Verify Email',
      trigger: 'Immediately after pending account creation. Secure link; 24-hour expiry.',
      subject: 'Verify your Sterling Connect email',
      previewText: 'Confirm your email address to get started.',
      variables: ['{first_name}', '{verification_url}'],
      body: 'Hi {first_name},\n\nWelcome to Sterling Connect. Confirm your email address to set up your profile and begin exploring readiness, learning and opportunities.\n\n[Verify my email]\n\nIf the button does not work, open this link: {verification_url}\n\nIf you did not create this account, you can ignore this email.\n\nThe Sterling team',
      status: 'ACTIVE',
    },
    {
      id: 'EM001',
      name: 'EM001: Welcome to Sterling Connect',
      trigger: 'After verified email, once per account; deep link onboarding.',
      subject: 'Welcome to Sterling Connect',
      previewText: 'Your next step starts with your profile.',
      variables: ['{first_name}'],
      body: 'Hi {first_name},\n\nYour email is verified. You can now build your profile, reflect on your readiness and explore opportunities that may fit your goals.\n\nStart by choosing your pathway and completing the details that matter to you. You can use both Career & Employment and Education & Scholarships.\n\n[Set up my profile]\n\nCore Connect features are free. Where professional learning is paid, it is optional. Scholarship learning is free.\n\nThe Sterling team',
      status: 'ACTIVE',
    },
    {
      id: 'EM003',
      name: 'EM003: Assessment Results Ready',
      trigger: 'Once per completed attempt. Avoid sensitive score disclosure in email subject.',
      subject: 'Your {pathway_readiness_name} results are ready',
      previewText: 'Explore your preparation and practical next steps.',
      variables: ['{first_name}', '{pathway_readiness_name}'],
      body: 'Hi {first_name},\n\nYou have completed your {pathway_readiness_name} assessment. Your result and recommended next steps are available in Sterling Connect.\n\nUse them to identify useful preparation actions while continuing to explore opportunities.\n\n[View my results]\n\nYour result is a development guide. It does not confirm eligibility or guarantee selection, employment or a scholarship award.\n\nThe Sterling team',
      status: 'ACTIVE',
    },
    {
      id: 'EM004',
      name: 'EM004: Opportunity Closing Soon',
      trigger: 'Seven days before deadline, once per user/opportunity/window.',
      subject: 'Reminder {opportunity_title} closes soon',
      previewText: 'Keep this deadline in view.',
      variables: ['{first_name}', '{opportunity_title}', '{deadline_display}', '{preferences_url}'],
      body: 'Hi {first_name},\n\nYou saved {opportunity_title}. Its advertised application deadline is {deadline_display}.\n\nReview the requirements and submit through the provider’s official process if you decide to apply. Check the official website in case the details have changed.\n\n[Review opportunity]\n\nAlready applied? Update your application tracker in Sterling Connect.\n\nManage these reminders: {preferences_url}\n\nThe Sterling team',
      status: 'ACTIVE',
    },
    {
      id: 'EM005',
      name: 'EM005: Application Update Follow-up',
      trigger: 'Proposed day 14 and day 28 after applied_at; maximum two. Stop terminal outcomes.',
      subject: 'Any update on {opportunity_title}',
      previewText: 'Keep your application tracker up to date.',
      variables: ['{first_name}', '{opportunity_title}', '{preferences_url}'],
      body: 'Hi {first_name},\n\nYou recorded an application for {opportunity_title}. Have you received an update?\n\nYou can record a shortlist, interview, offer, scholarship award or other outcome in your tracker. If you haven’t heard back, leave the status unchanged.\n\n[Update my application]\n\nThis reminder does not mean the provider has made a decision.\n\nManage these reminders: {preferences_url}\n\nThe Sterling team',
      status: 'ACTIVE',
    },
    {
      id: 'AUTH_RESET',
      name: 'AUTH_RESET: Password Reset',
      trigger: 'Send only to account email after valid request. 1-hour expiry.',
      subject: 'Reset your Sterling Connect password',
      previewText: 'Use this link to choose a new password.',
      variables: ['{first_name}', '{reset_url}'],
      body: 'Hi {first_name},\n\nWe received a request to reset your Sterling Connect password.\n\n[Reset my password]\n\nIf the button does not work, open this link: {reset_url}\n\nIf you did not make this request, you can ignore this email. Your password will stay the same.\n\nThe Sterling team',
      status: 'ACTIVE',
    },
    {
      id: 'EM006',
      name: 'EM006: Opportunity Digest',
      trigger: 'Later-phase optional digest, disabled at launch unless explicitly enabled.',
      subject: 'New opportunities to explore in Sterling Connect',
      previewText: 'Review new opportunities that may fit your profile.',
      variables: ['{first_name}', '{opportunity_digest_items}', '{preferences_url}'],
      body: 'Hi {first_name},\n\nThere are new opportunities you may want to explore:\n\n{opportunity_digest_items}\n\n[Explore opportunities]\n\nEach suggestion uses the information available about your profile and the opportunity. Check the official requirements before applying.\n\nManage updates or unsubscribe: {preferences_url}\n\nThe Sterling team',
      status: 'ACTIVE',
    },
  ];

  private readonly approvedTemplateVariables = [
    '{first_name}',
    '{email_masked}',
    '{pathway_readiness_name}',
    '{verification_code}',
    '{verification_url}',
    '{opportunity_title}',
    '{deadline_display}',
    '{reset_url}',
    '{preferences_url}',
    '{opportunity_digest_items}',
  ];

  // ==========================================
  // A13: EMAIL TEMPLATES
  // ==========================================
  getEmailTemplates() {
    return {
      templates: this.emailTemplatesStore,
      approvedVariables: this.approvedTemplateVariables,
      instruction: 'Review template variables and send a controlled test before activation.',
      variableErrorRule: 'Template contains an unsupported variable. Correct it before activation.',
    };
  }

  private validateTemplateVariables(text?: string) {
    if (!text) return;
    const matches = text.match(/\{[^}]+\}/g) || [];
    for (const v of matches) {
      if (!this.approvedTemplateVariables.includes(v)) {
        throw new BadRequestException(
          'Template contains an unsupported variable. Correct it before activation.',
        );
      }
    }
  }

  createEmailTemplate(
    dto: {
      id?: string;
      code?: string;
      name: string;
      trigger?: string;
      subject: string;
      previewText?: string;
      body: string;
      status?: string;
    },
    adminId: string,
    ipAddress?: string,
  ) {
    const templateId = (dto.id || dto.code || '').trim().toUpperCase();
    if (!templateId) {
      throw new BadRequestException('Template code or ID is required.');
    }
    if (!dto.name?.trim()) {
      throw new BadRequestException('Template name is required.');
    }

    if (dto.subject) this.validateTemplateVariables(dto.subject);
    if (dto.previewText) this.validateTemplateVariables(dto.previewText);
    if (dto.body) this.validateTemplateVariables(dto.body);

    const existing = this.emailTemplatesStore.find((t) => t.id === templateId);
    if (existing) {
      throw new BadRequestException(`Email template with ID "${templateId}" already exists.`);
    }

    const matches = ((dto.subject || '') + ' ' + (dto.body || '')).match(/\{[^}]+\}/g) || [];
    const uniqueVars = Array.from(new Set(matches));

    const newTemplate = {
      id: templateId,
      name: dto.name.trim(),
      trigger: (dto.trigger || 'Custom administrator notification trigger').trim(),
      subject: (dto.subject || '').trim(),
      previewText: (dto.previewText || '').trim(),
      variables: uniqueVars,
      body: dto.body || '',
      status: dto.status || 'ACTIVE',
    };

    this.emailTemplatesStore.push(newTemplate);

    this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'EMAIL_TEMPLATE_CREATED',
        entityType: 'EmailTemplate',
        entityId: dto.id,
        payload: { name: dto.name },
        ipAddress,
      },
    }).catch(() => {});

    return newTemplate;
  }

  updateEmailTemplate(
    id: string,
    dto: {
      subject?: string;
      previewText?: string;
      body?: string;
      status?: string;
    },
    adminId: string,
    ipAddress?: string,
  ) {
    const tpl = this.emailTemplatesStore.find((t) => t.id === id);
    if (!tpl) throw new NotFoundException(`Email template "${id}" not found.`);

    if (dto.subject) this.validateTemplateVariables(dto.subject);
    if (dto.previewText) this.validateTemplateVariables(dto.previewText);
    if (dto.body) this.validateTemplateVariables(dto.body);

    if (dto.subject) tpl.subject = dto.subject.trim();
    if (dto.previewText) tpl.previewText = dto.previewText.trim();
    if (dto.body) tpl.body = dto.body;
    if (dto.status) tpl.status = dto.status;

    const matches = (tpl.subject + ' ' + tpl.body).match(/\{[^}]+\}/g) || [];
    tpl.variables = Array.from(new Set(matches));

    this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'EMAIL_TEMPLATE_UPDATED',
        entityType: 'EmailTemplate',
        entityId: id,
        payload: dto,
        ipAddress,
      },
    }).catch(() => {});

    return tpl;
  }

  deleteEmailTemplate(id: string, adminId: string, ipAddress?: string) {
    const index = this.emailTemplatesStore.findIndex((t) => t.id === id);
    if (index === -1) throw new NotFoundException(`Email template "${id}" not found.`);

    const deleted = this.emailTemplatesStore.splice(index, 1)[0];

    this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'EMAIL_TEMPLATE_DELETED',
        entityType: 'EmailTemplate',
        entityId: id,
        payload: { name: deleted.name },
        ipAddress,
      },
    }).catch(() => {});

    return { success: true, message: `Email template "${deleted.name}" removed.` };
  }

  async bulkDeleteEmailTemplates(ids: string[], adminId: string, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No template IDs provided for bulk delete.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        this.deleteEmailTemplate(id, adminId, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Template ${id}: ${err.message}`);
      }
    }
    return { success: true, deletedCount: count, totalRequested: ids.length, errors };
  }

  async sendTestEmail(templateId: string, recipientEmail: string, adminId: string) {
    let success = false;
    switch (templateId) {
      case 'EM002':
        success = await this.mailService.sendVerificationEmail(recipientEmail, 'Administrator', '123456');
        break;
      case 'EM001':
        success = await this.mailService.sendWelcomeEmail(recipientEmail, 'Administrator');
        break;
      case 'EM003':
        success = await this.mailService.sendAssessmentCompletedEmail(
          recipientEmail,
          'Administrator',
          'career readiness',
        );
        break;
      case 'EM004':
        success = await this.mailService.sendDeadlineReminderEmail(
          recipientEmail,
          'Administrator',
          'Senior Systems Architect',
          '15 December 2026',
          'sample-id',
        );
        break;
      case 'EM005':
        success = await this.mailService.sendApplicationFollowUpEmail(
          recipientEmail,
          'Administrator',
          'Senior Systems Architect',
          'sample-app-id',
        );
        break;
      case 'AUTH_RESET':
        success = await this.mailService.sendPasswordResetEmail(
          recipientEmail,
          'Administrator',
          'sample-reset-token',
        );
        break;
      case 'EM006':
        success = await this.mailService.sendOpportunitiesDigestEmail(
          recipientEmail,
          'Administrator',
          '<p><strong>Senior Systems Architect</strong> • Sterling Global Cloud • London (Hybrid) • Closes 30 Apr 2027</p>',
        );
        break;
      default:
        throw new NotFoundException(`Unknown template ID: ${templateId}`);
    }

    return {
      success,
      recipient: recipientEmail,
      message: success
        ? `Controlled test email [${templateId}] dispatched to ${recipientEmail}`
        : 'Test email transmission failed. Check SMTP configuration.',
    };
  }

  async getEmailLogs(query: {
    page?: number;
    limit?: number;
    status?: string;
    triggerType?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query.triggerType && query.triggerType !== 'ALL') {
      where.triggerType = query.triggerType;
    }
    if (query.search?.trim()) {
      where.OR = [
        { recipientEmail: { contains: query.search.trim() } },
        { subject: { contains: query.search.trim() } },
        { triggerType: { contains: query.search.trim() } },
      ];
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, logs, sentCount, failedCount] = await Promise.all([
      this.prisma.emailLog.count({ where }),
      this.prisma.emailLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailLog.count({ where: { status: 'SENT' } }),
      this.prisma.emailLog.count({ where: { status: 'FAILED' } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats: {
        total,
        sent: sentCount,
        failed: failedCount,
        successRate: total > 0 ? Math.round((sentCount / (sentCount + failedCount || 1)) * 100) : 100,
      },
    };
  }

  // ==========================================
  // A14: ADMIN ACCESS & STAFF ROLES
  // ==========================================
  async getStaff() {
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      staff,
      instruction: 'Grant staff only the access they need.',
      revocationNote: 'Revoking access removes this person’s administration permissions.',
    };
  }

  async inviteStaff(
    dto: { email: string; firstName?: string; lastName?: string; role?: UserRole },
    currentAdmin: { id: string; role: UserRole },
    ipAddress?: string,
  ) {
    const email = dto.email.trim().toLowerCase();
    const role = dto.role || UserRole.ADMIN;

    let targetUser = await this.prisma.user.findUnique({ where: { email } });
    if (targetUser) {
      targetUser = await this.prisma.user.update({
        where: { email },
        data: { role, status: 'ACTIVE' },
      });
    } else {
      const bcrypt = require('bcryptjs');
      const tempHash = await bcrypt.hash('SterlingStaff2026!', 10);
      targetUser = await this.prisma.user.create({
        data: {
          email,
          firstName: dto.firstName?.trim() || 'Staff',
          lastName: dto.lastName?.trim() || 'Member',
          passwordHash: tempHash,
          role,
          status: 'ACTIVE',
          isEmailVerified: true,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: currentAdmin.id,
        action: 'STAFF_INVITED',
        entityType: 'User',
        entityId: targetUser.id,
        payload: { email, role },
        ipAddress,
      },
    });

    return {
      success: true,
      user: targetUser,
      message: `Admin access granted to ${email} as ${role}.`,
    };
  }

  async revokeStaffAccess(id: string, currentAdmin: { id: string; role: UserRole }, ipAddress?: string) {
    if (id === currentAdmin.id) {
      throw new BadRequestException('You cannot revoke your own administration access.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: UserRole.USER },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: currentAdmin.id,
        action: 'ADMIN_ACCESS_REVOKED',
        entityType: 'User',
        entityId: id,
        ipAddress,
      },
    });

    return {
      success: true,
      user: updated,
      message: 'Revoking access removes this person’s administration permissions.',
    };
  }

  async bulkRevokeStaff(ids: string[], currentAdmin: { id: string; role: UserRole }, ipAddress?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No staff IDs provided for bulk revoke.');
    }
    let count = 0;
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await this.revokeStaffAccess(id, currentAdmin, ipAddress);
        count++;
      } catch (err: any) {
        errors.push(`Staff ${id}: ${err.message}`);
      }
    }
    return { success: true, revokedCount: count, totalRequested: ids.length, errors };
  }

  // ==========================================
  // A15: SYSTEM SETTINGS & INTEGRATIONS
  // ==========================================
  /**
   * Publicly accessible platform links (consumed by Footer, mobile nav, user settings)
   */
  async getPublicSettings() {
    const defaultLinks = {
      academyUrl: 'https://learn.sterlinglrs.com',
      corporateUrl: 'https://sterlinglrs.com',
      privacyNoticeUrl: '/privacy',
      termsUrl: '/terms',
      supportEmail: 'support@sterlingconnect.org',
    };

    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: 'links' },
      });
      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        return {
          academyUrl: parsed.academyUrl || defaultLinks.academyUrl,
          corporateUrl: parsed.corporateUrl || defaultLinks.corporateUrl,
          privacyNoticeUrl: parsed.privacyNoticeUrl || defaultLinks.privacyNoticeUrl,
          termsUrl: parsed.termsUrl || defaultLinks.termsUrl,
          supportEmail: parsed.supportEmail || defaultLinks.supportEmail,
        };
      }
    } catch {}

    return defaultLinks;
  }

  async getSystemSettings() {
    // 1. Fetch persisted DB overrides from SystemSetting table
    const persistedSettings = await this.prisma.systemSetting.findMany();
    const settingsMap = new Map<string, any>();
    for (const s of persistedSettings) {
      try {
        settingsMap.set(s.key, JSON.parse(s.value));
      } catch {
        settingsMap.set(s.key, s.value);
      }
    }

    const defaultLinks = {
      academyUrl: 'https://learn.sterlinglrs.com',
      corporateUrl: 'https://sterlinglrs.com',
      privacyNoticeUrl: '/privacy',
      termsUrl: '/terms',
      supportEmail: 'support@sterlingconnect.org',
    };

    const defaultReminders = {
      cronSchedule: '0 9 * * * (Daily at 9:00 AM UTC)',
      advanceNoticeDays: 7,
      targetStatus: 'SAVED, PREPARING',
      serviceRemindersEnabled: true,
    };

    const defaultSecurity = {
      accessTokenTtl: '15m',
      refreshTokenTtl: '7d',
      maxAssessmentAttemptsPerDay: 5,
    };

    const defaultGoogleAnalytics = {
      measurementId: this.config.get<string>('GA_MEASUREMENT_ID', 'G-8V6ZJ2E9X1'),
      propertyId: '438910291',
      streamName: 'SterlingConnect Production Web',
      enabled: true,
    };

    const defaultApiEndpoints = {
      coursesApiUrl: this.config.get<string>(
        'STERLING_COURSES_API_URL',
        'https://sterlinglrs.com/wp-json/tutor/v1/courses',
      ),
      coursePricesApiUrl: this.config.get<string>(
        'STERLING_COURSE_PRICES_API_URL',
        '',
      ),
      opportunitiesApiUrl: this.config.get<string>(
        'STERLING_OPPORTUNITIES_API_URL',
        'https://sterlinglrs.com/wp-json/tutor/v1/opportunities',
      ),
    };

    const links = settingsMap.get('links') || defaultLinks;
    const apiEndpoints = settingsMap.get('apiEndpoints') || defaultApiEndpoints;
    const reminders = settingsMap.get('reminders') || defaultReminders;
    const security = settingsMap.get('security') || defaultSecurity;
    const googleAnalytics = settingsMap.get('googleAnalytics') || defaultGoogleAnalytics;

    return {
      instruction: 'Configure approved links, external API endpoints, reminders and integration settings.',
      settings: {
        links,
        apiEndpoints,
        reminders,
        security,
        googleAnalytics,
      },
    };
  }

  async updateSystemSettings(dto: any, adminId: string, ipAddress?: string) {
    const keys = ['links', 'apiEndpoints', 'reminders', 'security', 'googleAnalytics'];
    for (const key of keys) {
      if (dto[key]) {
        await this.prisma.systemSetting.upsert({
          where: { key },
          update: {
            value: JSON.stringify(dto[key]),
            category: key === 'googleAnalytics' || key === 'apiEndpoints' ? 'INTEGRATIONS' : 'OPERATIONAL',
            updatedAt: new Date(),
          },
          create: {
            key,
            value: JSON.stringify(dto[key]),
            category: key === 'googleAnalytics' || key === 'apiEndpoints' ? 'INTEGRATIONS' : 'OPERATIONAL',
            isSecret: false,
          },
        });
      }
    }

    // Write audit log per specification
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_SYSTEM_SETTINGS',
        entityType: 'SystemSetting',
        entityId: 'SYSTEM_SETTINGS',
        payload: {
          updatedSections: Object.keys(dto).filter((k) => keys.includes(k)),
        },
        ipAddress,
      },
    });

    return this.getSystemSettings();
  }

  async updateGoogleAnalytics(
    dto: { measurementId: string; enabled?: boolean; propertyId?: string; streamName?: string },
    adminId: string,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key: 'googleAnalytics' },
    });
    let current = {
      measurementId: this.config.get<string>('GA_MEASUREMENT_ID', 'G-8V6ZJ2E9X1'),
      propertyId: '438910291',
      streamName: 'SterlingConnect Production Web',
      enabled: true,
    };
    if (existing) {
      try {
        current = { ...current, ...JSON.parse(existing.value) };
      } catch {}
    }
    const updated = {
      ...current,
      ...dto,
      lastUpdated: new Date().toISOString(),
    };

    await this.prisma.systemSetting.upsert({
      where: { key: 'googleAnalytics' },
      update: {
        value: JSON.stringify(updated),
        category: 'INTEGRATIONS',
        updatedAt: new Date(),
      },
      create: {
        key: 'googleAnalytics',
        value: JSON.stringify(updated),
        category: 'INTEGRATIONS',
        isSecret: false,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'UPDATE_GOOGLE_ANALYTICS_CONFIG',
        entityType: 'SystemSetting',
        entityId: 'googleAnalytics',
        payload: { measurementId: updated.measurementId, enabled: updated.enabled },
        ipAddress,
      },
    });

    return {
      success: true,
      message: 'Google Analytics 4 configuration updated successfully.',
      googleAnalytics: updated,
    };
  }

  async testConnection() {
    try {
      // Check database connection
      await this.prisma.user.findFirst({ select: { id: true } });

      return {
        success: true,
        message: 'All system services and database connections are operational.',
      };
    } catch (err: any) {
      throw new BadRequestException(
        'Connection test failed. Unable to communicate with the database.',
      );
    }
  }

  // ==========================================
  // AUDIT LOGS (FR-18)
  // ==========================================
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        // Set to end of the day if it's just YYYY-MM-DD
        const end = new Date(params.endDate);
        if (params.endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteAuditLog(id: string, adminId?: string) {
    const existing = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Audit log record not found.');
    }
    await this.prisma.auditLog.delete({ where: { id } });
    return { success: true, message: 'Audit log record deleted successfully.' };
  }

  async bulkDeleteAuditLogs(ids: string[], adminId?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No audit log IDs provided for bulk delete.');
    }
    const res = await this.prisma.auditLog.deleteMany({
      where: { id: { in: ids } },
    });
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'AUDIT_LOGS_BULK_DELETED',
          entityType: 'AuditLog',
          payload: { count: res.count, ids },
        },
      });
    }
    return { success: true, deletedCount: res.count, totalRequested: ids.length };
  }

  async clearAuditLogs(beforeDate?: string, adminId?: string) {
    const where: any = {};
    if (beforeDate) {
      where.createdAt = { lte: new Date(beforeDate) };
    }
    const result = await this.prisma.auditLog.deleteMany({ where });
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'AUDIT_LOGS_CLEARED',
          entityType: 'AuditLog',
          payload: { deletedCount: result.count, beforeDate: beforeDate || 'ALL' },
        },
      });
    }
    return {
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} audit log records.`,
    };
  }

  async deleteEmailLog(id: string, adminId?: string) {
    const existing = await this.prisma.emailLog.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Email delivery log record not found.');
    }
    await this.prisma.emailLog.delete({ where: { id } });
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'EMAIL_LOG_DELETED',
          entityType: 'EmailLog',
          entityId: id,
          payload: { recipientEmail: existing.recipientEmail, triggerType: existing.triggerType },
        },
      });
    }
    return { success: true, message: 'Email delivery log record deleted successfully.' };
  }

  async bulkDeleteEmailLogs(ids: string[], adminId?: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('No email log IDs provided for bulk delete.');
    }
    const res = await this.prisma.emailLog.deleteMany({
      where: { id: { in: ids } },
    });
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'EMAIL_LOGS_BULK_DELETED',
          entityType: 'EmailLog',
          payload: { count: res.count, ids },
        },
      });
    }
    return { success: true, deletedCount: res.count, totalRequested: ids.length };
  }

  async clearEmailLogs(beforeDate?: string, adminId?: string) {
    const where: any = {};
    if (beforeDate) {
      where.createdAt = { lte: new Date(beforeDate) };
    }
    const result = await this.prisma.emailLog.deleteMany({ where });
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'EMAIL_LOGS_CLEARED',
          entityType: 'EmailLog',
          payload: { deletedCount: result.count, beforeDate: beforeDate || 'ALL' },
        },
      });
    }
    return {
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} email delivery log records.`,
    };
  }
}
