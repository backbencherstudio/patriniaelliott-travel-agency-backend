// src/modules/application/vendor-verification/vendor-verification.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorVerificationDto } from './dto/create-vendor-verification.dto/create-vendor-verification.dto';

@Injectable()
export class VendorVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVendorVerificationDto: CreateVendorVerificationDto, userId: string) {
    // Check if user exists
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }
    console.log(userData);
    const test= await this.prisma.vendorVerification.findFirst({where:{user_id:userId}})
    console.log(test);
    const existing = await this.prisma.vendorVerification.findUnique({ where: { user_id: userId } });
    if (existing) {
      return {
        success: false,
        message: 'Vendor verification already exists for this user.',
      };
    }

    const vendorVerification = await this.prisma.$transaction(async (prisma) => {
      const vendorVerification = await prisma.vendorVerification.create({
        data: {
          ...createVendorVerificationDto,
          user: { connect: { id: userId } },
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { type: 'vendor' },
      });

      return vendorVerification;
    });

    return {
      success: true,
      data: vendorVerification, 
    };
  }

}