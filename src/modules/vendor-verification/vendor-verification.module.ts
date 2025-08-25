import { Module } from '@nestjs/common';
import { VendorVerificationService } from './vendor-verification.service';
import { VendorVerificationController } from './vendor-verification.controller';

@Module({
  controllers: [VendorVerificationController],
  providers: [VendorVerificationService],
})
export class VendorVerificationModule {}
