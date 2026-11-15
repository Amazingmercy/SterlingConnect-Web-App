import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OpportunityType,
  OpportunityStatus,
  WorkArrangement,
  FundingLevel,
} from '@prisma/client';

export class EmploymentDetailDto {
  @IsNotEmpty()
  @IsString()
  subType: string;

  @IsNotEmpty()
  @IsString()
  sector: string;

  @IsNotEmpty()
  @IsString()
  function: string;

  @IsOptional()
  @IsEnum(WorkArrangement)
  workArrangement?: WorkArrangement;

  @IsNotEmpty()
  @IsString()
  experienceLevel: string;

  @IsNotEmpty()
  @IsString()
  minimumEducation: string;

  @IsOptional()
  @IsArray()
  eligibleNationalities?: string[];

  @IsOptional()
  @IsArray()
  requiredSkills?: string[];

  @IsOptional()
  @IsString()
  compensationRange?: string;
}

export class ScholarshipDetailDto {
  @IsOptional()
  @IsArray()
  studyLevels?: string[];

  @IsOptional()
  @IsArray()
  eligibleNationalities?: string[];

  @IsOptional()
  @IsArray()
  eligibleFields?: string[];

  @IsOptional()
  @IsString()
  academicRequirement?: string;

  @IsOptional()
  @IsString()
  experienceRequirement?: string;

  @IsOptional()
  @IsEnum(FundingLevel)
  fundingLevel?: FundingLevel;

  @IsOptional()
  @IsString()
  languageRequirement?: string;

  @IsOptional()
  programStartYear?: number;
}

export class CreateOpportunityDto {
  @IsOptional()
  @IsString()
  referenceCode?: string;

  @IsNotEmpty()
  @IsEnum(OpportunityType)
  opportunityType: OpportunityType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  organization: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @IsOptional()
  openingDate?: string | Date;

  @IsNotEmpty()
  deadline: string | Date;

  @IsNotEmpty()
  @IsUrl()
  applicationUrl: string;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsNotEmpty()
  @IsString()
  overview: string;

  @IsNotEmpty()
  @IsString()
  requirements: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmploymentDetailDto)
  employmentDetail?: EmploymentDetailDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScholarshipDetailDto)
  scholarshipDetail?: ScholarshipDetailDto;
}

export class UpdateOpportunityDto extends CreateOpportunityDto {}
