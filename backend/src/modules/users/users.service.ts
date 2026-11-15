import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateCommonProfileDto,
  UpdateEmploymentProfileDto,
  UpdateScholarshipProfileDto,
  UpdateUserPreferencesDto,
  RequestAccountDeletionDto,
  UpdateUserPersonalDto,
  ChangeUserPasswordDto,
} from './dto/profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves complete profile including Common, Employment, Scholarship,
   * uploaded documents, and overall completion percentage.
   */
  async getFullProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        commonProfile: true,
        employmentProfile: true,
        scholarshipProfile: true,
        documents: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    // Default structure if profiles not created yet
    const common = user.commonProfile || {
      countryOfResidence: 'Nigeria',
      nationalities: ['Nigerian'],
      currentStatus: 'Recent Graduate',
      highestQualification: "Bachelor's Degree",
      fieldOfStudy: 'Economics',
      institution: '',
      graduationYear: new Date().getFullYear().toString(),
      academicClassification: 'First Class Honours (or equivalent)',
      profileCompletion: 25,
    };

    const employment = user.employmentProfile || {
      employmentStatus: 'Seeking opportunity',
      yearsOfExperience: '1-2',
      careerLevel: 'Entry-level',
      sectorsOfInterest: ['Technology & Software', 'Finance & Banking'],
      functionsOfInterest: ['Product & Design', 'Data & Analytics'],
      skills: ['Communication', 'Research & Analysis'],
      preferredLocations: ['Nigeria', 'Remote (Global)'],
      workArrangement: 'HYBRID',
      opportunityTypes: ['Graduate programme', 'Full-time'],
      workAuthorisation: ['Nigeria'],
    };

    const scholarship = user.scholarshipProfile
      ? {
          ...user.scholarshipProfile,
          researchInterests: (() => {
            const raw = user.scholarshipProfile.researchInterests;
            if (!raw) return [];
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [raw];
            } catch {
              return raw.includes(',') ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [raw];
            }
          })(),
        }
      : {
          desiredStudyLevels: ["Master's Degree"],
          desiredFields: ['Economics & Public Policy', 'Development Studies'],
          academicClassification: 'First Class Honours (GPA 3.8/4.0+)',
          preferredStudyCountries: ['United Kingdom', 'Canada', 'United States'],
          fundingRequirement: 'FULLY_FUNDED',
          intendedStartYear: (new Date().getFullYear() + 1).toString(),
          languageTestStatus: 'Planning to take (IELTS / TOEFL)',
          researchInterests: [],
        };

    const documents = (user.documents || []).map((doc) => ({
      id: doc.id,
      name: doc.originalFileName,
      label: doc.originalFileName,
      category: doc.documentType === 'CV_RESUME' ? 'CV / Resume' : 'Academic Transcript',
      size: doc.fileSizeBytes,
      uploadedAt: doc.createdAt.toISOString(),
      type: doc.documentType,
    }));

    const cvDoc = documents.find((d) => d.type === 'CV_RESUME' || d.category === 'CV / Resume');
    if (cvDoc) {
      (common as any).cvDocument = cvDoc;
    }

    const completionPercentage = this.computeCompletion(common, employment, scholarship, documents);

    return {
      success: true,
      profile: {
        common,
        employment,
        scholarship,
        documents,
        completionPercentage,
      },
    };
  }

  /**
   * Updates Common Profile fields.
   */
  async updateCommonProfile(userId: string, dto: UpdateCommonProfileDto) {
    const updated = await this.prisma.commonProfile.upsert({
      where: { userId },
      create: {
        userId,
        locationCountry: dto.countryOfResidence || 'Nigeria',
        nationalities: dto.nationalities || ['Nigerian'],
        currentStatus: dto.currentStatus || 'Recent Graduate',
        highestQualification: dto.highestQualification || "Bachelor's Degree",
        qualification: dto.qualification || '',
        fieldOfStudy: dto.fieldOfStudy || 'General',
        graduationYear: dto.graduationYear ? parseInt(dto.graduationYear, 10) : null,
        profileCompletion: 40,
      },
      update: {
        locationCountry: dto.countryOfResidence,
        nationalities: dto.nationalities ? dto.nationalities : undefined,
        currentStatus: dto.currentStatus,
        highestQualification: dto.highestQualification,
        qualification: dto.qualification,
        fieldOfStudy: dto.fieldOfStudy,
        graduationYear: dto.graduationYear ? parseInt(dto.graduationYear, 10) : undefined,
      },
    });

    if (dto.cvDocument) {
      const existingCv = await this.prisma.userDocument.findFirst({
        where: { userId, documentType: 'CV_RESUME' },
      });
      if (existingCv) {
        await this.prisma.userDocument.update({
          where: { id: existingCv.id },
          data: {
            originalFileName: dto.cvDocument.name || 'CV.pdf',
            storedFileName: dto.cvDocument.name || 'CV.pdf',
            fileSizeBytes: dto.cvDocument.size || 1024,
            mimeType: dto.cvDocument.name?.endsWith('.docx')
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : dto.cvDocument.name?.endsWith('.doc')
              ? 'application/msword'
              : 'application/pdf',
          },
        });
      } else {
        await this.prisma.userDocument.create({
          data: {
            userId,
            documentType: 'CV_RESUME',
            originalFileName: dto.cvDocument.name || 'CV.pdf',
            storedFileName: dto.cvDocument.name || 'CV.pdf',
            fileSizeBytes: dto.cvDocument.size || 1024,
            mimeType: dto.cvDocument.name?.endsWith('.docx')
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : dto.cvDocument.name?.endsWith('.doc')
              ? 'application/msword'
              : 'application/pdf',
            storagePath: '/uploads/cv',
          },
        });
      }
    }

    return { success: true, common: updated };
  }

  /**
   * Updates Employment Profile preferences and qualifications.
   */
  async updateEmploymentProfile(userId: string, dto: UpdateEmploymentProfileDto) {
    const yearsExp =
      typeof dto.yearsOfExperience === 'string'
        ? parseFloat(dto.yearsOfExperience) || 0
        : dto.yearsOfExperience || 0;

    const updated = await this.prisma.employmentProfile.upsert({
      where: { userId },
      create: {
        userId,
        employmentStatus: dto.employmentStatus || 'Seeking opportunity',
        yearsOfExperience: yearsExp,
        careerLevel: dto.careerLevel || 'Entry-level',
        sectorsOfInterest: dto.sectorsOfInterest || [],
        functionsOfInterest: dto.functionsOfInterest || [],
        skills: dto.skills || [],
        preferredLocations: dto.preferredLocations || [],
        workArrangement: (dto.workArrangement as any) || 'ANY',
        opportunityTypes: dto.opportunityTypes || ['Full-time'],
        workAuthorisation: dto.workAuthorisation || ['Nigeria'],
      },
      update: {
        employmentStatus: dto.employmentStatus,
        yearsOfExperience: yearsExp,
        careerLevel: dto.careerLevel,
        sectorsOfInterest: dto.sectorsOfInterest,
        functionsOfInterest: dto.functionsOfInterest,
        skills: dto.skills,
        preferredLocations: dto.preferredLocations,
        workArrangement: dto.workArrangement as any,
        opportunityTypes: dto.opportunityTypes,
        workAuthorisation: dto.workAuthorisation,
      },
    });

    return { success: true, employment: updated };
  }

  /**
   * Updates Scholarship Profile targets and eligibility.
   */
  async updateScholarshipProfile(userId: string, dto: UpdateScholarshipProfileDto) {
    const startYear =
      typeof dto.intendedStartYear === 'string'
        ? parseInt(dto.intendedStartYear, 10) || null
        : dto.intendedStartYear || null;

    const updated = await this.prisma.scholarshipProfile.upsert({
      where: { userId },
      create: {
        userId,
        desiredStudyLevels: dto.desiredStudyLevels || ["Master's Degree"],
        desiredFields: dto.desiredFields || [],
        academicClassification: dto.academicClassification || 'First Class',
        preferredStudyCountries: dto.preferredStudyCountries || [],
        fundingRequirement: (dto.fundingRequirement as any) || 'FULLY_FUNDED',
        intendedStartYear: startYear,
        languageTestStatus: dto.languageTestStatus || 'Not taken',
        researchInterests:
          Array.isArray(dto.researchInterests)
            ? JSON.stringify(dto.researchInterests)
            : typeof dto.researchInterests === 'string'
            ? dto.researchInterests
            : '[]',
      },
      update: {
        desiredStudyLevels: dto.desiredStudyLevels,
        desiredFields: dto.desiredFields,
        academicClassification: dto.academicClassification,
        preferredStudyCountries: dto.preferredStudyCountries,
        fundingRequirement: dto.fundingRequirement as any,
        intendedStartYear: startYear,
        languageTestStatus: dto.languageTestStatus,
        researchInterests:
          Array.isArray(dto.researchInterests)
            ? JSON.stringify(dto.researchInterests)
            : typeof dto.researchInterests === 'string'
            ? dto.researchInterests
            : '[]',
      },
    });

    return { success: true, scholarship: updated };
  }

  /**
   * Dynamic profile completion calculation matching frontend scoring logic.
   */
  private computeCompletion(
    common: any,
    employment: any,
    scholarship: any,
    documents: any[],
  ): number {
    let earned = 0;
    const total = 100;

    // Common (35 pts)
    if (common.countryOfResidence || common.locationCountry) earned += 7;
    if (common.nationalities && common.nationalities.length > 0) earned += 7;
    if (common.highestQualification) earned += 7;
    if (common.fieldOfStudy) earned += 7;
    if (common.currentStatus) earned += 7;

    // Employment / Career (25 pts)
    if (employment.careerLevel) earned += 5;
    if (employment.sectorsOfInterest && employment.sectorsOfInterest.length > 0) earned += 5;
    if (employment.functionsOfInterest && employment.functionsOfInterest.length > 0) earned += 5;
    if (employment.skills && employment.skills.length > 0) earned += 5;
    if (employment.preferredLocations && employment.preferredLocations.length > 0) earned += 5;

    // Scholarship (25 pts)
    if (scholarship.desiredStudyLevels && scholarship.desiredStudyLevels.length > 0) earned += 7;
    if (scholarship.desiredFields && scholarship.desiredFields.length > 0) earned += 6;
    if (scholarship.preferredStudyCountries && scholarship.preferredStudyCountries.length > 0) earned += 6;
    if (scholarship.fundingRequirement) earned += 6;

    // Documents (15 pts)
    if (documents && documents.length > 0) earned += 15;

    return Math.min(100, Math.round((earned / total) * 100));
  }

  /**
   * GET /api/users/preferences
   * Retrieves user notification and regional preferences.
   */
  async getUserPreferences(userId: string) {
    const common = await this.prisma.commonProfile.findUnique({
      where: { userId },
    });

    const prefs = (common?.interests as any)?.__preferences || {
      serviceReminders: true,
      marketingUpdates: true,
      timezone: 'Africa/Lagos',
    };

    return {
      success: true,
      preferences: {
        serviceReminders: prefs.serviceReminders ?? true,
        marketingUpdates: prefs.marketingUpdates ?? true,
        timezone: prefs.timezone || 'Africa/Lagos',
      },
    };
  }

  /**
   * PUT /api/users/preferences
   * Persists user notification and regional preferences.
   */
  async updateUserPreferences(userId: string, dto: UpdateUserPreferencesDto) {
    const common = await this.prisma.commonProfile.findUnique({
      where: { userId },
    });

    const currentInterests = (common?.interests as any) || {};
    const existingPrefs = currentInterests.__preferences || {};

    const updatedPrefs = {
      ...existingPrefs,
      serviceReminders:
        dto.serviceReminders !== undefined ? dto.serviceReminders : (existingPrefs.serviceReminders ?? true),
      marketingUpdates:
        dto.marketingUpdates !== undefined ? dto.marketingUpdates : (existingPrefs.marketingUpdates ?? true),
      timezone: dto.timezone || existingPrefs.timezone || 'Africa/Lagos',
    };

    const newInterests = {
      ...(typeof currentInterests === 'object' && !Array.isArray(currentInterests) ? currentInterests : {}),
      __preferences: updatedPrefs,
    };

    if (common) {
      await this.prisma.commonProfile.update({
        where: { userId },
        data: {
          interests: newInterests,
        },
      });
    } else {
      await this.prisma.commonProfile.create({
        data: {
          userId,
          locationCountry: 'Nigeria',
          nationalities: ['Nigerian'],
          highestQualification: "Bachelor's Degree",
          fieldOfStudy: 'General Studies',
          interests: newInterests,
        },
      });
    }

    return {
      success: true,
      preferences: updatedPrefs,
      message: 'Your preferences have been updated.',
    };
  }

  /**
   * POST /api/users/request-deletion
   * Reauthenticates password and records compliant deletion request audit log.
   */
  async requestAccountDeletion(userId: string, dto: RequestAccountDeletionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.password) {
      const isValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Incorrect password provided for deletion confirmation.');
      }
    }

    // Record deletion request in AuditLog
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'ACCOUNT_DELETION_REQUESTED',
        entityType: 'User',
        entityId: userId,
        payload: {
          email: user.email,
          requestedAt: new Date().toISOString(),
          status: 'PENDING_POLICY_REVIEW',
        },
      },
    });

    return {
      success: true,
      message: 'Your deletion request has been received. We’ll contact you using your account email address.',
    };
  }

  /**
   * PUT /api/users/profile/personal
   * Updates user name, country, nationality across User and CommonProfile.
   */
  async updatePersonalDetails(userId: string, dto: UpdateUserPersonalDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName?.trim() || user.firstName,
        lastName: dto.lastName?.trim() || user.lastName,
      },
    });

    // Also sync country/nationality to commonProfile
    if (dto.country || dto.nationality) {
      await this.prisma.commonProfile.upsert({
        where: { userId },
        create: {
          userId,
          locationCountry: dto.country || 'Nigeria',
          nationalities: dto.nationality ? [dto.nationality] : ['Nigerian'],
          highestQualification: "Bachelor's Degree",
          fieldOfStudy: 'General Studies',
        },
        update: {
          locationCountry: dto.country ? dto.country : undefined,
          nationalities: dto.nationality ? [dto.nationality] : undefined,
        },
      });
    }

    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        country: dto.country || 'Nigeria',
        nationality: dto.nationality || 'Nigerian',
      },
      message: 'Your changes have been saved.',
    };
  }

  /**
   * POST /api/users/change-password
   * Verifies current password and updates passwordHash securely.
   */
  async changePassword(userId: string, dto: ChangeUserPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!dto.currentPassword || !dto.newPassword) {
      throw new BadRequestException('Current password and new password are required.');
    }

    if (dto.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters.');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match.');
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
      },
    });

    return {
      success: true,
      message: 'Password updated securely.',
    };
  }
}
