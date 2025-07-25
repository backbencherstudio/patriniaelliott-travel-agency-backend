import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVendorPackageDto } from './dto/create-vendor-package.dto';

@Injectable()
export class VendorPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVendorPackageDto: CreateVendorPackageDto, userId: string) {
    // Check if user exists
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }

    // Remove user_id from DTO before passing to Prisma
    const { user_id, ...rest } = createVendorPackageDto;
    const data:any={
        ...rest,
        user: { connect: { id: userId } },
    }

    const vendorPackage = await this.prisma.package.create({ data });

    return {
      success: true,
      data: vendorPackage,
    };
  }
}
