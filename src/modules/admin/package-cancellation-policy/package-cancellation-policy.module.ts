import { Module } from '@nestjs/common';
import { PackageCancellationPolicyService } from './package-cancellation-policy.service';
import { PackageCancellationPolicyController } from './package-cancellation-policy.controller';

@Module({
  controllers: [PackageCancellationPolicyController],
  providers: [PackageCancellationPolicyService],
})
export class PackageCancellationPolicyModule {}
