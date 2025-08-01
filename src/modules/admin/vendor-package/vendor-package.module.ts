import { Module } from '@nestjs/common';
import { VendorPackageController } from './vendor-package.controller';
import { VendorPackageService } from './vendor-package.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendorPackageController],
  providers: [VendorPackageService]
})
export class VendorPackageModule {}
