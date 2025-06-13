import { Test, TestingModule } from '@nestjs/testing';
import { CancellationPolicyController } from './cancellation-policy.controller';
import { CancellationPolicyService } from './cancellation-policy.service';

describe('CancellationPolicyController', () => {
  let controller: CancellationPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CancellationPolicyController],
      providers: [CancellationPolicyService],
    }).compile();

    controller = module.get<CancellationPolicyController>(
      CancellationPolicyController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
