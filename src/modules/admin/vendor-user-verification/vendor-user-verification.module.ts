import { Module } from '@nestjs/common';import { PrismaModule } from '../../../prisma/prisma.module';
import { VendorUserVerificationAdminService } from './vendor-user-verification.service';
import { VendorUserVerificationAdminController } from './vendor-user-verification.controller';


@Module({
  imports: [PrismaModule],
  controllers: [VendorUserVerificationAdminController],
  providers: [VendorUserVerificationAdminService],
})
export class VendorUserVerificationAdminModule {}
