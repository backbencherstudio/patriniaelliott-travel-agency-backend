import { PartialType } from '@nestjs/swagger';
import { CreatePackageCancellationPolicyDto } from './create-package-cancellation-policy.dto';

export class UpdatePackageCancellationPolicyDto extends PartialType(CreatePackageCancellationPolicyDto) {}
