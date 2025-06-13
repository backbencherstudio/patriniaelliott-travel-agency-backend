import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateSocialMediaDto } from './dto/create-social-media.dto';
import { UpdateSocialMediaDto } from './dto/update-social-media.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class SocialMediaService {
  constructor(private prisma: PrismaService) {}

  async create(createSocialMediaDto: CreateSocialMediaDto) {
    try {
      const data: any = {};

      if (createSocialMediaDto.name) {
        data.name = createSocialMediaDto.name;
      }
      if (createSocialMediaDto.url) {
        data.url = createSocialMediaDto.url;
      }
      if (createSocialMediaDto.icon) {
        data.icon = createSocialMediaDto.icon;
      }
      if (createSocialMediaDto.sort_order) {
        data.sort_order = createSocialMediaDto.sort_order;
      }

      await this.prisma.socialMedia.create({
        data: createSocialMediaDto,
      });

      return {
        success: true,
        message: 'Social media created successfully',
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
      const socialMedia = await this.prisma.socialMedia.findMany({
        orderBy: {
          sort_order: 'asc',
        },
        select: {
          id: true,
          name: true,
          url: true,
          icon: true,
          sort_order: true,
        },
      });
      return {
        success: true,
        data: socialMedia,
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
      const socialMedia = await this.prisma.socialMedia.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          url: true,
          icon: true,
          sort_order: true,
        },
      });
      return {
        success: true,
        data: socialMedia,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateSocialMediaDto: UpdateSocialMediaDto) {
    try {
      const data: any = {};

      if (updateSocialMediaDto.name) {
        data.name = updateSocialMediaDto.name;
      }
      if (updateSocialMediaDto.url) {
        data.url = updateSocialMediaDto.url;
      }
      if (updateSocialMediaDto.icon) {
        data.icon = updateSocialMediaDto.icon;
      }
      if (updateSocialMediaDto.sort_order) {
        data.sort_order = updateSocialMediaDto.sort_order;
      }

      await this.prisma.socialMedia.update({
        where: { id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });
      return {
        success: true,
        message: 'Social media updated successfully',
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
      // check if social media exists
      const socialMedia = await this.prisma.socialMedia.findUnique({
        where: { id },
      });
      if (!socialMedia) {
        return {
          success: false,
          message: 'Social media not found',
        };
      }

      // delete social media
      await this.prisma.socialMedia.delete({
        where: { id },
      });
      return {
        success: true,
        message: 'Social media deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
