import { Test, TestingModule } from '@nestjs/testing';
import { PackageCancellationPolicyController } from './package-cancellation-policy.controller';
import { PackageCancellationPolicyService } from './package-cancellation-policy.service';

describe('PackageCancellationPolicyController', () => {
  let controller: PackageCancellationPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageCancellationPolicyController],
      providers: [PackageCancellationPolicyService],
    }).compile();

    controller = module.get<PackageCancellationPolicyController>(PackageCancellationPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
