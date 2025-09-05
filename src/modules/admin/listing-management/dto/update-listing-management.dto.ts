import { PartialType } from '@nestjs/swagger';
import { CreateListingManagementDto } from './create-listing-management.dto';

export class UpdateListingManagementDto extends PartialType(CreateListingManagementDto) {}
