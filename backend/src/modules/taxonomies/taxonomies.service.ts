import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaxonomyType } from '@prisma/client';

@Injectable()
export class TaxonomiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Return all active controlled taxonomies for user forms, opportunity tagging and filtering
   */
  async getActiveTaxonomies(type?: TaxonomyType) {
    const items = await this.prisma.taxonomy.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
      },
      include: {
        aliases: {
          select: { id: true, alias: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const grouped: Record<string, typeof items> = {
      SECTOR: [],
      FUNCTION: [],
      SKILL: [],
      STUDY_FIELD: [],
      DEGREE_LEVEL: [],
      COUNTRY: [],
    };

    for (const item of items) {
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      }
    }

    return {
      items,
      grouped,
    };
  }
}
