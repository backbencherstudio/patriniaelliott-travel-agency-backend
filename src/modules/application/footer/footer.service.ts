import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import appConfig from 'src/config/app.config';
import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';

@Injectable()
export class FooterService {
  constructor(private prisma: PrismaService) {}

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
        },
      });

      const websiteInfo = await this.prisma.websiteInfo.findFirst({
        select: {
          id: true,
          name: true,
          address: true,
          phone_number: true,
          email: true,
          logo: true,
          favicon: true,
          copyright: true,
        },
      });

      // add url to logo and favicon
      websiteInfo.logo = SojebStorage.url(
        appConfig().storageUrl.websiteInfo + websiteInfo.logo,
      );
      websiteInfo.favicon = SojebStorage.url(
        appConfig().storageUrl.websiteInfo + websiteInfo.favicon,
      );

      return {
        success: true,
        data: {
          social_media_links: socialMedia,
          website_info: websiteInfo,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
