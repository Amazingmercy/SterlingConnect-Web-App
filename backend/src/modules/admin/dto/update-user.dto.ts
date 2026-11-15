import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsEnum(UserStatus)
  status: UserStatus;
}

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
