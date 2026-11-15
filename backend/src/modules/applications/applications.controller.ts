import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  UpdateApplicationNotesDto,
} from './dto/application.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  async getApplications(@CurrentUser('id') userId: string) {
    return this.applicationsService.findAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrUpdate(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.createOrUpdate(userId, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(userId, applicationId, dto);
  }

  @Patch(':id/notes')
  async updateNotes(
    @CurrentUser('id') userId: string,
    @Param('id') applicationId: string,
    @Body() dto: UpdateApplicationNotesDto,
  ) {
    return this.applicationsService.updateNotes(userId, applicationId, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') applicationId: string,
  ) {
    return this.applicationsService.remove(userId, applicationId);
  }
}
