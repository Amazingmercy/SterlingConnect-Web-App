import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import { SaveDraftDto, SubmitAssessmentDto } from './dto/assessment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class ReadinessController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get('questions')
  async getQuestions(@CurrentUser('id') userId: string) {
    return this.readinessService.getQuestions(userId);
  }

  @Post('save-draft')
  @HttpCode(HttpStatus.OK)
  async saveDraft(
    @CurrentUser('id') userId: string,
    @Body() dto: SaveDraftDto,
  ) {
    return this.readinessService.saveDraft(userId, dto);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.readinessService.submitAssessment(userId, dto);
  }

  @Get('results')
  async getResults(@CurrentUser('id') userId: string) {
    return this.readinessService.getLatestResults(userId);
  }
}
