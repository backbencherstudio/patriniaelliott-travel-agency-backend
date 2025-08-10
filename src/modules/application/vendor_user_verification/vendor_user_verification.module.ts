import { Module } from '@nestjs/common';
import { VendorUserVerificationService } from './vendor_user_verification.service';
import { VendorUserVerificationController } from './vendor_user_verification.controller';

@Module({
  providers: [VendorUserVerificationService],
  controllers: [VendorUserVerificationController]
})
export class VendorUserVerificationModule {}
