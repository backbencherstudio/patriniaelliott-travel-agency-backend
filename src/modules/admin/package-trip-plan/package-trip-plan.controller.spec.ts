import { Test, TestingModule } from '@nestjs/testing';
import { PackageTripPlanController } from './package-trip-plan.controller';
import { PackageTripPlanService } from './package-trip-plan.service';

describe('PackageTripPlanController', () => {
  let controller: PackageTripPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PackageTripPlanController],
      providers: [PackageTripPlanService],
    }).compile();

    controller = module.get<PackageTripPlanController>(PackageTripPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
