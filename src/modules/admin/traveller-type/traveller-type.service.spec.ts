import { Test, TestingModule } from '@nestjs/testing';
import { TravellerTypeService } from './traveller-type.service';

describe('TravellerTypeService', () => {
  let service: TravellerTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravellerTypeService],
    }).compile();

    service = module.get<TravellerTypeService>(TravellerTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
