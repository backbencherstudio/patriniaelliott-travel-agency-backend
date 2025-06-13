import { PartialType } from '@nestjs/swagger';
import { CreatePackageTripPlanDto } from './create-package-trip-plan.dto';

export class UpdatePackageTripPlanDto extends PartialType(
  CreatePackageTripPlanDto,
) {}
