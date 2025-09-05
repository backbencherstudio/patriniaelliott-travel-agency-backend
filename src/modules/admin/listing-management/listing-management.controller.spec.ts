import { Test, TestingModule } from '@nestjs/testing';
import { ListingManagementController } from './listing-management.controller';
import { ListingManagementService } from './listing-management.service';

describe('ListingManagementController', () => {
  let controller: ListingManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingManagementController],
      providers: [ListingManagementService],
    }).compile();

    controller = module.get<ListingManagementController>(ListingManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
