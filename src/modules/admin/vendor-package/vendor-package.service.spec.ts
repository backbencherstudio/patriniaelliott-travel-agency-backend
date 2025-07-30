import { Test, TestingModule } from '@nestjs/testing';
import { VendorPackageService } from './vendor-package.service';

describe('VendorPackageService', () => {
  let service: VendorPackageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorPackageService],
    }).compile();

    service = module.get<VendorPackageService>(VendorPackageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
