import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsJSON } from 'class-validator';
import { Transform } from 'class-transformer';

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
    description: 'Country name to associate',
    example: 'France',
  })
  country_name: string;

  @ApiProperty({
    required: false,
    description: 'Tour duration value',
    example: 5,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  tour_duration?: number;

  @ApiProperty({
    required: false,
    description: 'Duration type (e.g., days, hours)',
    example: 'days',
  })
  @IsOptional()
  @IsString()
  duration_type?: string;

  @ApiProperty({
    required: false,
    description: 'Tour price',
    example: 199.99,
  })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value == null ? undefined : Number(value)))
  @IsNumber()
  tour_pice?: number;

  @ApiProperty({
    required: false,
    description: 'Cancellation policy JSON as string or object',
    example: '{"free_cancel_before_days": 3}',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return value;
    }
  })
  @IsJSON()
  cancellation_policy?: string;

  @ApiProperty({
    required: false,
    description: 'Primary language (e.g., en, fr)',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
