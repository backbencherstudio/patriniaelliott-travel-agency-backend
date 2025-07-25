import { Test, TestingModule } from '@nestjs/testing';
import { VendorVerificationService } from './vendor-verification.service';

describe('VendorVerificationService', () => {
  let service: VendorVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorVerificationService],
    }).compile();

    service = module.get<VendorVerificationService>(VendorVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
