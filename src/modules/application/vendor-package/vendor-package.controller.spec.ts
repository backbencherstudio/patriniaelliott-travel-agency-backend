import { Test, TestingModule } from '@nestjs/testing';
import { VendorPackageController } from './vendor-package.controller';

describe('VendorPackageController', () => {
  let controller: VendorPackageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorPackageController],
    }).compile();

    controller = module.get<VendorPackageController>(VendorPackageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
