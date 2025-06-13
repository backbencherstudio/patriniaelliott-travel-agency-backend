import { Test, TestingModule } from '@nestjs/testing';
import { PackageTripPlanService } from './package-trip-plan.service';

describe('PackageTripPlanService', () => {
  let service: PackageTripPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PackageTripPlanService],
    }).compile();

    service = module.get<PackageTripPlanService>(PackageTripPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
