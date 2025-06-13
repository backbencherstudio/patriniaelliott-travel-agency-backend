import { ApiProperty } from '@nestjs/swagger';

export class CreateTravellerTypeDto {
  @ApiProperty({
    description: 'Type of traveller',
    type: 'string',
    required: true,
  })
  type: string;
}
