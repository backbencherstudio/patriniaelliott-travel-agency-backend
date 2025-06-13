import { Module } from '@nestjs/common';
import { ExtraServiceService } from './extra-service.service';
import { ExtraServiceController } from './extra-service.controller';

@Module({
  controllers: [ExtraServiceController],
  providers: [ExtraServiceService],
})
export class ExtraServiceModule {}
