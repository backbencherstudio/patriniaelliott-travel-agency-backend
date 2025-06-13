import { Module } from '@nestjs/common';
import { PackageService } from './package.service';
import { PackageController } from './package.controller';
import { PackageTripPlanModule } from '../package-trip-plan/package-trip-plan.module';

@Module({
  controllers: [PackageController],
  providers: [PackageService],
  imports: [PackageTripPlanModule],
})
export class PackageModule {}
