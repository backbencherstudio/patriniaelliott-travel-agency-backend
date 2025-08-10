import { Test, TestingModule } from '@nestjs/testing';
import { VendorUserVerificationController } from './vendor_user_verification.controller';

describe('VendorUserVerificationController', () => {
  let controller: VendorUserVerificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorUserVerificationController],
    }).compile();

    controller = module.get<VendorUserVerificationController>(VendorUserVerificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
