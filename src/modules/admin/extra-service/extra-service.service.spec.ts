import { Test, TestingModule } from '@nestjs/testing';
import { ExtraServiceService } from './extra-service.service';

describe('ExtraServiceService', () => {
  let service: ExtraServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExtraServiceService],
    }).compile();

    service = module.get<ExtraServiceService>(ExtraServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
