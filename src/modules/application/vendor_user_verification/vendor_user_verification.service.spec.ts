import { Test, TestingModule } from '@nestjs/testing';
import { VendorUserVerificationService } from './vendor_user_verification.service';

describe('VendorUserVerificationService', () => {
  let service: VendorUserVerificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorUserVerificationService],
    }).compile();

    service = module.get<VendorUserVerificationService>(VendorUserVerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
