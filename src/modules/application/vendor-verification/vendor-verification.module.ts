import { Module } from '@nestjs/common';
import { VendorVerificationService } from './vendor-verification.service';
import { VendorVerificationController } from './vendor-verification.controller';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [VendorVerificationController],
  providers: [VendorVerificationService, PrismaService],
})
export class VendorVerificationModule {}