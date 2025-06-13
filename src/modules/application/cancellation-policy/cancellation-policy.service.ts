import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CancellationPolicyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const websiteInfo = await this.prisma.websiteInfo.findFirst({
        select: {
          cancellation_policy: true,
        },
      });

      if (!websiteInfo) {
        return {
          success: false,
          message: 'Website info not found',
        };
      }

      return {
        success: true,
        data: websiteInfo,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
