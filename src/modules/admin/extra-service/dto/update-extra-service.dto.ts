import { PartialType } from '@nestjs/swagger';
import { CreateExtraServiceDto } from './create-extra-service.dto';

export class UpdateExtraServiceDto extends PartialType(CreateExtraServiceDto) {}
