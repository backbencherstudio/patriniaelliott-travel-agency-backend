import { ApiProperty } from '@nestjs/swagger';

export class CreatePackageTripPlanDto {
  @ApiProperty({
    description: 'Trip plan title',
    example: 'Trip plan title',
  })
  title: string;

  @ApiProperty({
    description: 'Trip plan description',
    example: 'Trip plan description',
  })
  description: string;

  @ApiProperty({
    description: 'Trip plan images',
    example: 'Trip plan images',
  })
  images?: any;
}
