import { Test, TestingModule } from '@nestjs/testing';
import { CancellationPolicyService } from './cancellation-policy.service';

describe('CancellationPolicyService', () => {
  let service: CancellationPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CancellationPolicyService],
    }).compile();

    service = module.get<CancellationPolicyService>(CancellationPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
