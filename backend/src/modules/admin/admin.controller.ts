import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole, UserStatus, OpportunityType, OpportunityStatus, Pathway, TaxonomyType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto, UpdateUserRoleDto } from './dto/update-user.dto';
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/admin-opportunity.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==========================================
  // A02: Overview & KPIs
  // ==========================================
  @Get('overview')
  async getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getOverviewStats(startDate, endDate);
  }

  // ==========================================
  // A03: User Management
  // ==========================================
  @Get('users')
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('pathway') pathway?: Pathway,
  ) {
    return this.adminService.getUsers({ page, limit, search, role, status, pathway });
  }

  @Patch('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateUserStatus(id, dto.status, req.user.id, ipAddress);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateUserRole(id, dto.role, req.user, ipAddress);
  }

  @Put('users/:id')
  async updateUserDetails(
    @Param('id') id: string,
    @Body() dto: { firstName?: string; lastName?: string; activePathway?: Pathway; isEmailVerified?: boolean },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateUserDetails(id, dto, req.user.id, ipAddress);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteUser(id, req.user.id, ipAddress);
  }

  @Post('users/bulk-delete')
  async bulkDeleteUsers(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteUsers(ids, req.user.id, ipAddress);
  }

  // ==========================================
  // A04, A05, A06: Opportunities Management
  // ==========================================
  @Get('opportunities')
  async getOpportunities(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('opportunityType') opportunityType?: OpportunityType,
    @Query('status') status?: OpportunityStatus,
  ) {
    return this.adminService.getOpportunities({ page, limit, search, opportunityType, status });
  }

  @Post('opportunities')
  async createOpportunity(
    @Body() dto: CreateOpportunityDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.createOpportunity(dto, req.user.id, ipAddress);
  }

  @Put('opportunities/:id')
  async updateOpportunity(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateOpportunity(id, dto, req.user.id, ipAddress);
  }

  @Patch('opportunities/:id/status')
  async updateOpportunityStatus(
    @Param('id') id: string,
    @Body('status') status: OpportunityStatus,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateOpportunityStatus(id, status, req.user.id, ipAddress);
  }

  @Delete('opportunities/:id')
  async deleteOpportunity(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteOpportunity(id, req.user.id, ipAddress);
  }

  @Post('opportunities/bulk-delete')
  async bulkDeleteOpportunities(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteOpportunities(ids, req.user.id, ipAddress);
  }

  @Post('opportunities/sync')
  async syncOpportunitiesFromApi(@Body('url') customUrl?: string) {
    return this.adminService.syncOpportunitiesFromApi(customUrl);
  }

  // ==========================================
  // A07: Bulk Importer
  // ==========================================
  @Get('opportunities/bulk-import/template')
  async downloadImportTemplate(
    @Query('type') type: OpportunityType,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const targetFormat = format?.toLowerCase() === 'xlsx' ? 'xlsx' : 'csv';
    const template = await this.adminService.generateImportTemplate(
      type || OpportunityType.EMPLOYMENT,
      targetFormat,
    );
    res.setHeader('Content-Type', template.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${template.filename}"`);
    res.send(template.buffer);
  }

  @Post('opportunities/bulk-import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewBulkImport(
    @UploadedFile() file?: Express.Multer.File,
    @Body('rows') rowsJson?: string,
    @Body('opportunityType') opportunityType?: OpportunityType,
    @Query('opportunityType') queryType?: OpportunityType,
  ) {
    const expectedType = opportunityType || queryType;
    if (file) {
      return this.adminService.previewBulkImport(file.buffer, file.originalname, expectedType);
    }

    if (rowsJson) {
      let parsedRows: any[] = [];
      try {
        parsedRows = typeof rowsJson === 'string' ? JSON.parse(rowsJson) : rowsJson;
      } catch {
        throw new BadRequestException('Invalid JSON rows format.');
      }
      const validRows: any[] = [];
      const errors: any[] = [];
      parsedRows.forEach((r, idx) => {
        const val = this.adminService.validateImportRow(r, idx + 1, expectedType);
        if (val.valid && val.parsed) {
          validRows.push({ ...val.parsed, _rowNumber: idx + 1 });
        } else {
          val.errors.forEach((err) => {
            errors.push({ rowNumber: idx + 1, message: err });
          });
        }
      });
      return {
        totalRows: parsedRows.length,
        validCount: validRows.length,
        invalidCount: parsedRows.length - validRows.length,
        validRows,
        errors,
        expectedType,
        summaryMessage: `${validRows.length} valid rows. ${parsedRows.length - validRows.length} rows need attention. No invalid rows will be imported.`,
      };
    }

    throw new BadRequestException('Please provide a file (.csv, .xlsx) or rows in the payload.');
  }

  @Post('opportunities/bulk-import/commit')
  async commitBulkImport(
    @Body('validRows') validRows: any[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.commitBulkImport(validRows, req.user.id, ipAddress);
  }

  // ==========================================
  // A08: Assessment Versions
  // ==========================================
  @Get('assessment-versions')
  async getAssessmentVersions() {
    return this.adminService.getAssessmentVersions();
  }

  @Get('assessment-versions/:id')
  async getAssessmentVersionById(@Param('id') id: string) {
    return this.adminService.getAssessmentVersionById(id);
  }

  @Post('assessment-versions')
  async createDraftAssessmentVersion(
    @Body('title') title: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.createDraftAssessmentVersion(title, req.user.id, ipAddress);
  }

  @Post('assessment-versions/:id/publish')
  async publishAssessmentVersion(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.publishAssessmentVersion(id, req.user.id, ipAddress);
  }

  @Put('assessment-versions/:id')
  async updateAssessmentVersion(
    @Param('id') id: string,
    @Body('title') title: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateAssessmentVersion(id, title, req.user.id, ipAddress);
  }

  @Delete('assessment-versions/:id')
  async deleteAssessmentVersion(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteAssessmentVersion(id, req.user.id, ipAddress);
  }

  @Post('assessment-versions/bulk-delete')
  async bulkDeleteAssessmentVersions(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteAssessmentVersions(ids, req.user.id, ipAddress);
  }

  @Put('assessment-versions/questions/:questionId')
  async updateAssessmentQuestion(
    @Param('questionId') questionId: string,
    @Body() dto: { statement?: string; construct?: string; isActive?: boolean },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateAssessmentQuestion(questionId, dto, req.user.id, ipAddress);
  }

  @Post('assessment-versions/:versionId/questions')
  async createAssessmentQuestion(
    @Param('versionId') versionId: string,
    @Body()
    dto: {
      categoryId: string;
      questionCode: string;
      statement: string;
      construct?: string;
      orderInCategory?: number;
    },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.createAssessmentQuestion(versionId, dto, req.user.id, ipAddress);
  }

  @Delete('assessment-versions/questions/:questionId')
  async deleteAssessmentQuestion(
    @Param('questionId') questionId: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteAssessmentQuestion(questionId, req.user.id, ipAddress);
  }

  // ==========================================
  // A09: Recommendation Rules
  // ==========================================
  @Get('recommendation-rules')
  async getRecommendationRules() {
    return this.adminService.getRecommendationRules();
  }

  @Post('recommendation-rules')
  async createRecommendationRule(
    @Body() dto: { categoryId: string; readinessBand: string; courseCode: string; ruleName: string },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.createRecommendationRule(dto, req.user.id, ipAddress);
  }

  @Put('recommendation-rules/:id')
  async updateRecommendationRule(
    @Param('id') id: string,
    @Body() dto: { categoryId?: string; readinessBand?: string; courseCode?: string; ruleName?: string },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateRecommendationRule(id, dto, req.user.id, ipAddress);
  }

  @Delete('recommendation-rules/:id')
  async deleteRecommendationRule(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteRecommendationRule(id, req.user.id, ipAddress);
  }

  @Post('recommendation-rules/bulk-delete')
  async bulkDeleteRecommendationRules(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteRecommendationRules(ids, req.user.id, ipAddress);
  }

  @Patch('recommendation-rules/:id/toggle')
  async toggleRecommendationRule(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.toggleRecommendationRule(id, req.user.id, ipAddress);
  }

  // ==========================================
  // A10: Taxonomies
  // ==========================================
  @Get('taxonomies')
  async getTaxonomies(@Query('type') type?: TaxonomyType) {
    return this.adminService.getTaxonomies(type);
  }

  @Post('taxonomies')
  async addTaxonomyOption(
    @Body() dto: { type: TaxonomyType; code: string; name: string },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.addTaxonomyOption(dto, req.user.id, ipAddress);
  }

  @Put('taxonomies/:id')
  async updateTaxonomyLabel(
    @Param('id') id: string,
    @Body('name') name: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateTaxonomyLabel(id, name, req.user.id, ipAddress);
  }

  @Post('taxonomies/:id/aliases')
  async addTaxonomyAlias(
    @Param('id') id: string,
    @Body('alias') alias: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.addTaxonomyAlias(id, alias, req.user.id, ipAddress);
  }

  @Patch('taxonomies/:id/deactivate')
  async deactivateTaxonomyOption(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deactivateTaxonomyOption(id, req.user.id, ipAddress);
  }

  @Delete('taxonomies/:id')
  async deleteTaxonomyOption(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteTaxonomyOption(id, req.user.id, ipAddress);
  }

  @Post('taxonomies/bulk-delete')
  async bulkDeleteTaxonomies(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteTaxonomies(ids, req.user.id, ipAddress);
  }

  @Delete('taxonomies/aliases/:aliasId')
  async deleteTaxonomyAlias(
    @Param('aliasId') aliasId: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteTaxonomyAlias(aliasId, req.user.id, ipAddress);
  }

  // ==========================================
  // A11: Applications & Outcomes
  // ==========================================
  @Get('applications-outcomes')
  async getApplicationsAndOutcomes(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getApplicationsAndOutcomes({ page, limit, status });
  }

  @Patch('applications-outcomes/:id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body('status') status: any,
    @Body('notes') notes: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateApplicationStatus(id, status, notes, req.user.id, ipAddress);
  }

  @Delete('applications-outcomes/:id')
  async deleteApplication(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteApplication(id, req.user.id, ipAddress);
  }

  @Post('applications-outcomes/bulk-delete')
  async bulkDeleteApplications(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteApplications(ids, req.user.id, ipAddress);
  }

  // ==========================================
  // A12: Analytics & Funnel
  // ==========================================
  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Patch('analytics/google-analytics')
  @Roles(UserRole.SUPER_ADMIN)
  async updateGoogleAnalytics(
    @Body() dto: { measurementId: string; enabled?: boolean; propertyId?: string; streamName?: string },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateGoogleAnalytics(dto, req.user.id, ipAddress);
  }

  // ==========================================
  // A13: Email Templates
  // ==========================================
  @Get('email-templates')
  async getEmailTemplates() {
    return this.adminService.getEmailTemplates();
  }

  @Post('email-templates')
  async createEmailTemplate(
    @Body() dto: { id: string; name: string; trigger: string; subject: string; previewText: string; body: string; status?: string },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.createEmailTemplate(dto, req.user.id, ipAddress);
  }

  @Put('email-templates/:id')
  async updateEmailTemplate(
    @Param('id') id: string,
    @Body() dto: { subject?: string; previewText?: string; body?: string; status?: string },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateEmailTemplate(id, dto, req.user.id, ipAddress);
  }

  @Delete('email-templates/:id')
  async deleteEmailTemplate(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.deleteEmailTemplate(id, req.user.id, ipAddress);
  }

  @Post('email-templates/bulk-delete')
  async bulkDeleteEmailTemplates(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkDeleteEmailTemplates(ids, req.user.id, ipAddress);
  }

  @Post('email-templates/:id/test')
  async sendTestEmail(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const adminEmail = req.user.email;
    return this.adminService.sendTestEmail(id, adminEmail, req.user.id);
  }

  // ==========================================
  // Dedicated Email Delivery Audit Logs (A13/Overview)
  // ==========================================
  @Get('email-logs')
  async getEmailLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('triggerType') triggerType?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getEmailLogs({
      page,
      limit,
      status,
      triggerType,
      search,
      startDate,
      endDate,
    });
  }

  @Delete('email-logs/:id')
  async deleteEmailLog(@Param('id') id: string, @Req() req: any) {
    return this.adminService.deleteEmailLog(id, req.user.id);
  }

  @Post('email-logs/bulk-delete')
  async bulkDeleteEmailLogs(@Body('ids') ids: string[], @Req() req: any) {
    return this.adminService.bulkDeleteEmailLogs(ids, req.user.id);
  }

  @Delete('email-logs')
  async clearEmailLogs(@Query('beforeDate') beforeDate: string | undefined, @Req() req: any) {
    return this.adminService.clearEmailLogs(beforeDate, req.user.id);
  }

  // ==========================================
  // A14: Staff Management
  // ==========================================
  @Get('staff')
  async getStaff() {
    return this.adminService.getStaff();
  }

  @Post('staff/invite')
  async inviteStaff(
    @Body() dto: { email: string; firstName?: string; lastName?: string; role?: UserRole },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.inviteStaff(dto, req.user, ipAddress);
  }

  @Patch('staff/:id/role')
  async updateStaffRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.updateUserRole(id, role, req.user, ipAddress);
  }

  @Delete('staff/:id')
  async revokeStaffAccess(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.revokeStaffAccess(id, req.user, ipAddress);
  }

  @Post('staff/bulk-revoke')
  async bulkRevokeStaff(
    @Body('ids') ids: string[],
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    return this.adminService.bulkRevokeStaff(ids, req.user, ipAddress);
  }

  // ==========================================
  // A15: System Settings & Integrations
  // ==========================================
  @Get('settings')
  async getSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put('settings')
  async updateSettings(@Body() dto: any, @Req() req: any) {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    return this.adminService.updateSystemSettings(dto, req.user?.id || 'system_admin', ipAddress);
  }

  @Post('settings/test-connection')
  async testConnection() {
    return this.adminService.testConnection();
  }

  // ==========================================
  // Audit Trail (FR-18)
  // ==========================================
  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAuditLogs({ page, limit, action, entityType, startDate, endDate });
  }

  @Delete('audit-logs/:id')
  async deleteAuditLog(@Param('id') id: string, @Req() req: any) {
    return this.adminService.deleteAuditLog(id, req.user.id);
  }

  @Post('audit-logs/bulk-delete')
  async bulkDeleteAuditLogs(@Body('ids') ids: string[], @Req() req: any) {
    return this.adminService.bulkDeleteAuditLogs(ids, req.user.id);
  }

  @Delete('audit-logs')
  async clearAuditLogs(@Query('beforeDate') beforeDate: string | undefined, @Req() req: any) {
    return this.adminService.clearAuditLogs(beforeDate, req.user.id);
  }
}
