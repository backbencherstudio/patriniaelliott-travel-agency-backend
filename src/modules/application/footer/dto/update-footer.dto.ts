import { PartialType } from '@nestjs/swagger';
import { CreateFooterDto } from './create-footer.dto';

export class UpdateFooterDto extends PartialType(CreateFooterDto) {}
