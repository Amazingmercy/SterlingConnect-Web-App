import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateCommonProfileDto,
  UpdateEmploymentProfileDto,
  UpdateScholarshipProfileDto,
  UpdateUserPreferencesDto,
  RequestAccountDeletionDto,
  UpdateUserPersonalDto,
  ChangeUserPasswordDto,
} from './dto/profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getFullProfile(userId);
  }

  @Get('preferences')
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.usersService.getUserPreferences(userId);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.usersService.updateUserPreferences(userId, dto);
  }

  @Post('request-deletion')
  @HttpCode(HttpStatus.OK)
  async requestDeletion(
    @CurrentUser('id') userId: string,
    @Body() dto: RequestAccountDeletionDto,
  ) {
    return this.usersService.requestAccountDeletion(userId, dto);
  }

  @Put('profile/personal')
  @HttpCode(HttpStatus.OK)
  async updatePersonalDetails(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserPersonalDto,
  ) {
    return this.usersService.updatePersonalDetails(userId, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeUserPasswordDto,
  ) {
    return this.usersService.changePassword(userId, dto);
  }

  @Put('profile/common')
  @HttpCode(HttpStatus.OK)
  async updateCommonProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCommonProfileDto,
  ) {
    return this.usersService.updateCommonProfile(userId, dto);
  }

  @Put('profile/employment')
  @HttpCode(HttpStatus.OK)
  async updateEmploymentProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEmploymentProfileDto,
  ) {
    return this.usersService.updateEmploymentProfile(userId, dto);
  }

  @Put('profile/scholarship')
  @HttpCode(HttpStatus.OK)
  async updateScholarshipProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateScholarshipProfileDto,
  ) {
    return this.usersService.updateScholarshipProfile(userId, dto);
  }
}
