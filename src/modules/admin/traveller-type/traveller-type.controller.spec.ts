import { Test, TestingModule } from '@nestjs/testing';
import { TravellerTypeController } from './traveller-type.controller';
import { TravellerTypeService } from './traveller-type.service';

describe('TravellerTypeController', () => {
  let controller: TravellerTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravellerTypeController],
      providers: [TravellerTypeService],
    }).compile();

    controller = module.get<TravellerTypeController>(TravellerTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
