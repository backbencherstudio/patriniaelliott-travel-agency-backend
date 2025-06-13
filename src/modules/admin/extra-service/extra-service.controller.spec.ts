import { Test, TestingModule } from '@nestjs/testing';
import { ExtraServiceController } from './extra-service.controller';
import { ExtraServiceService } from './extra-service.service';

describe('ExtraServiceController', () => {
  let controller: ExtraServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExtraServiceController],
      providers: [ExtraServiceService],
    }).compile();

    controller = module.get<ExtraServiceController>(ExtraServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
