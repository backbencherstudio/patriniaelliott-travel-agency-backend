import { Test, TestingModule } from '@nestjs/testing';
import { PackageCancellationPolicyService } from './package-cancellation-policy.service';

describe('PackageCancellationPolicyService', () => {
  let service: PackageCancellationPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PackageCancellationPolicyService],
    }).compile();

    service = module.get<PackageCancellationPolicyService>(PackageCancellationPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
