import { Module } from '@nestjs/common';
import { VendorPackageController } from './vendor-package.controller';
import { VendorPackageService } from './vendor-package.service';

@Module({
  controllers: [VendorPackageController],
  providers: [VendorPackageService],
})
export class VendorPackageModule {} 