import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { WorkArrangement, FundingRequirement } from '@prisma/client';

export class UpdateCommonProfileDto {
  @IsOptional()
  @IsString()
  countryOfResidence?: string;

  @IsOptional()
  @IsArray()
  nationalities?: string[];

  @IsOptional()
  @IsString()
  currentStatus?: string;

  @IsOptional()
  @IsString()
  highestQualification?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  graduationYear?: string;

  @IsOptional()
  @IsString()
  academicClassification?: string;

  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @IsOptional()
  cvDocument?: any;
}

export class UpdateEmploymentProfileDto {
  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  yearsOfExperience?: any;

  @IsOptional()
  @IsString()
  careerLevel?: string;

  @IsOptional()
  @IsString()
  sector_preference_mode?: string;

  @IsOptional()
  @IsArray()
  sector_ids?: string[];

  @IsOptional()
  @IsArray()
  sectorsOfInterest?: string[];

  @IsOptional()
  @IsString()
  function_preference_mode?: string;

  @IsOptional()
  @IsArray()
  function_ids?: string[];

  @IsOptional()
  @IsArray()
  functionsOfInterest?: string[];

  @IsOptional()
  @IsArray()
  skills?: string[];

  @IsOptional()
  @IsArray()
  preferredLocations?: string[];

  @IsOptional()
  @IsEnum(WorkArrangement)
  workArrangement?: WorkArrangement;

  @IsOptional()
  @IsArray()
  opportunityTypes?: string[];

  @IsOptional()
  workAuthorisation?: any;
}

export class UpdateScholarshipProfileDto {
  @IsOptional()
  @IsArray()
  desiredStudyLevels?: string[];

  @IsOptional()
  @IsArray()
  desiredFields?: string[];

  @IsOptional()
  @IsString()
  academicClassification?: string;

  @IsOptional()
  @IsArray()
  preferredStudyCountries?: string[];

  @IsOptional()
  @IsEnum(FundingRequirement)
  fundingRequirement?: FundingRequirement;

  @IsOptional()
  intendedStartYear?: any;

  @IsOptional()
  @IsString()
  languageTestStatus?: string;

  @IsOptional()
  researchInterests?: any;

  @IsOptional()
  noPreferredCountry?: boolean;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;
}

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsBoolean()
  serviceReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingUpdates?: boolean;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class RequestAccountDeletionDto {
  @IsString()
  password?: string;
}

export class UpdateUserPersonalDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  nationality?: string;
}

export class ChangeUserPasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  newPassword: string;
}
