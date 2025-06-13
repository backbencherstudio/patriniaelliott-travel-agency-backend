import { Module } from '@nestjs/common';
import { PackageTripPlanService } from './package-trip-plan.service';
import { PackageTripPlanController } from './package-trip-plan.controller';

@Module({
  controllers: [PackageTripPlanController],
  providers: [PackageTripPlanService],
})
export class PackageTripPlanModule {}
