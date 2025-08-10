import { Test, TestingModule } from '@nestjs/testing';
import { VendorUserVerificationAdminService } from './vendor-user-verification.service';

describe('VendorUserVerificationService', () => {
  let service: VendorUserVerificationAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorUserVerificationAdminService],
    }).compile();

    service = module.get<VendorUserVerificationAdminService>(VendorUserVerificationAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
