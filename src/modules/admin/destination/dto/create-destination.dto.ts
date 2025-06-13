import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDestinationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Destination name',
    example: 'Paris',
  })
  name: string;

  @ApiProperty({
    description: 'Destination description',
    example: 'Paris is the capital of France',
  })
  description: string;

  @ApiProperty({
    description: 'Destination images',
    example: ['image1.jpg', 'image2.jpg'],
  })
  destination_images: string[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Country id',
    example: '1',
  })
  country_id: string;
}
