import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateCountryDto } from './dto/create-country.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { q?: string; country_code?: string; dial_code?: string; page?: string; limit?: string }) {
    try {
      const page = query?.page ? parseInt(query.page, 10) : 1;
      const limit = query?.limit ? parseInt(query.limit, 10) : 100;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (query?.q) {
        where.OR = [
          { name: { contains: query.q, mode: 'insensitive' } },
          { country_code: { contains: query.q, mode: 'insensitive' } },
          { dial_code: { contains: query.q, mode: 'insensitive' } },
        ];
      }
      if (query?.country_code) {
        where.country_code = { equals: query.country_code, mode: 'insensitive' };
      }
      if (query?.dial_code) {
        where.dial_code = { contains: query.dial_code, mode: 'insensitive' };
      }

      const [data, total] = await this.prisma.$transaction([
        this.prisma.country.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            country_code: true,
            dial_code: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.country.count({ where }),
      ]);

      const pagination = { page, limit, total, total_pages: Math.ceil(total / limit) };

      return {
        success: true,
        data,
        pagination,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async create(createCountryDto: CreateCountryDto) {
    try {
      const existingCountry = await this.prisma.country.findFirst({
        where: {
          country_code: createCountryDto.country_code,
        },
      });
      if (existingCountry) {
        throw new BadRequestException(`Country already exists which is ${createCountryDto.name}`);
      }
      const created = await this.prisma.country.create({
        data: {
          name: createCountryDto.name,
          flag: createCountryDto.flag,
          country_code: createCountryDto.country_code,
          dial_code: createCountryDto.dial_code,
        },
        select: {
          id: true,
          name: true,
          flag: true,
          country_code: true,
          dial_code: true,
        },
      });
      return { success: true, data: created };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async update(id: string, dto: CreateCountryDto) {
    try {
      const updated = await this.prisma.country.update({
        where: { id },
        data: {
          name: dto.name,
          flag: dto.flag,
          country_code: dto.country_code,
          dial_code: dto.dial_code,
        },
        select: {
          id: true,
          name: true,
          flag: true,
          country_code: true,
          dial_code: true,
        },
      });
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.country.delete({
        where: { id },
        select: {
          id: true,
          name: true,
          flag: true,
          country_code: true,
          dial_code: true,
        },
      });
      return { success: true, data: deleted };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
