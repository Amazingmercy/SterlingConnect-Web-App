import { Controller, Get, Query } from '@nestjs/common';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomyType } from '@prisma/client';

@Controller('taxonomies')
export class TaxonomiesController {
  constructor(private readonly taxonomiesService: TaxonomiesService) {}

  @Get()
  async getTaxonomies(@Query('type') type?: TaxonomyType) {
    return this.taxonomiesService.getActiveTaxonomies(type);
  }
}
