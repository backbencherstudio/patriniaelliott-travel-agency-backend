import { Module } from '@nestjs/common';
import { ListingManagementService } from './listing-management.service';
import { ListingManagementController } from './listing-management.controller';

@Module({
  controllers: [ListingManagementController],
  providers: [ListingManagementService],
})
export class ListingManagementModule {}
