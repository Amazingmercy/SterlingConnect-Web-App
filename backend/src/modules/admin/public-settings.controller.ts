import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('public')
  async getPublicSettings() {
    return this.adminService.getPublicSettings();
  }
}
