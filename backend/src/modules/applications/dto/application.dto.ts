import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus = ApplicationStatus.SAVED;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  appliedAt?: string;
}

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  appliedAt?: string;

  @IsOptional()
  @IsString()
  outcomeAt?: string;
}

export class UpdateApplicationNotesDto {
  @IsString()
  notes: string;
}
