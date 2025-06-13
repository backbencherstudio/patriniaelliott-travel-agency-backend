import { Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    try {
      // check if tag already exists
      const tag = await this.prisma.tag.findFirst({
        where: { name: createTagDto.name },
      });
      if (tag) {
        return {
          success: false,
          message: 'Tag already exists',
        };
      }

      await this.prisma.tag.create({
        data: createTagDto,
      });

      return {
        success: true,
        message: 'Tag created successfully',
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
      const tags = await this.prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          created_at: true,
          updated_at: true,
        },
      });
      return {
        success: true,
        data: tags,
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
      const tag = await this.prisma.tag.findUnique({
        where: { id: id },
        select: {
          id: true,
          name: true,
          created_at: true,
          updated_at: true,
        },
      });
      return {
        success: true,
        data: tag,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    try {
      const data = {};
      if (updateTagDto.name) {
        data['name'] = updateTagDto.name;
      }
      // check if tag already exists
      const tag = await this.prisma.tag.findFirst({
        where: { name: updateTagDto.name },
      });
      if (tag) {
        return {
          success: false,
          message: 'Tag already exists',
        };
      }
      await this.prisma.tag.update({
        where: { id: id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });

      return {
        success: true,
        message: 'Tag updated successfully',
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
      await this.prisma.tag.delete({
        where: { id: id },
      });

      return {
        success: true,
        message: 'Tag deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
