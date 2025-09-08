import { Test, TestingModule } from '@nestjs/testing';
import { ListingManagementService } from './listing-management.service';

describe('ListingManagementService', () => {
  let service: ListingManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListingManagementService],
    }).compile();

    service = module.get<ListingManagementService>(ListingManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
