import { Injectable } from '@nestjs/common';
import { CreateCountryDto } from './dto/create-country.dto';
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

  async create(createCountryDto: CreateCountryDto) {
    try {
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
}
