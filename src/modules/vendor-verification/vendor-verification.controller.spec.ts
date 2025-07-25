import { Test, TestingModule } from '@nestjs/testing';
import { VendorVerificationController } from './vendor-verification.controller';
import { VendorVerificationService } from './vendor-verification.service';

describe('VendorVerificationController', () => {
  let controller: VendorVerificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorVerificationController],
      providers: [VendorVerificationService],
    }).compile();

    controller = module.get<VendorVerificationController>(VendorVerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
