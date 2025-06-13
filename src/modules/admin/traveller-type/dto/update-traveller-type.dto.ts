import { PartialType } from '@nestjs/swagger';
import { CreateTravellerTypeDto } from './create-traveller-type.dto';

export class UpdateTravellerTypeDto extends PartialType(CreateTravellerTypeDto) {}
