import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const countries = await this.prisma.country.findMany({
        select: {
          id: true,
          name: true,
          flag: true,
        },
      });
      return {
        success: true,
        data: countries,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
