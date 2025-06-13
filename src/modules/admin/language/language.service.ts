import { Injectable } from '@nestjs/common';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LanguageService {
  constructor(private prisma: PrismaService) {}

  async create(createLanguageDto: CreateLanguageDto) {
    try {
      const data = {};
      if (createLanguageDto.name) {
        data['name'] = createLanguageDto.name;
      }
      if (createLanguageDto.code) {
        data['code'] = createLanguageDto.code;
      }

      await this.prisma.language.create({
        data: createLanguageDto,
      });

      return {
        success: true,
        message: 'Language created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

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

  async findOne(id: string) {
    try {
      const language = await this.prisma.language.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

      if (!language) {
        return {
          success: false,
          message: 'Language not found',
        };
      }

      return {
        success: true,
        data: language,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateLanguageDto: UpdateLanguageDto) {
    try {
      const data = {};
      if (updateLanguageDto.name) {
        data['name'] = updateLanguageDto.name;
      }
      if (updateLanguageDto.code) {
        data['code'] = updateLanguageDto.code;
      }

      await this.prisma.language.update({
        where: {
          id: id,
        },
        data: updateLanguageDto,
      });

      return {
        success: true,
        message: 'Language updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      const language = await this.prisma.language.findUnique({
        where: {
          id: id,
        },
      });

      if (!language) {
        return {
          success: false,
          message: 'Language not found',
        };
      }

      await this.prisma.language.delete({
        where: {
          id: id,
        },
      });

      return {
        success: true,
        message: 'Language deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
