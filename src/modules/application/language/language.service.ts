import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LanguageService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const languages = await this.prisma.language.findMany({
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

      return {
        success: true,
        data: languages,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
