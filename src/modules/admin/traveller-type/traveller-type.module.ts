import { Module } from '@nestjs/common';
import { TravellerTypeService } from './traveller-type.service';
import { TravellerTypeController } from './traveller-type.controller';

@Module({
  controllers: [TravellerTypeController],
  providers: [TravellerTypeService],
})
export class TravellerTypeModule {}
