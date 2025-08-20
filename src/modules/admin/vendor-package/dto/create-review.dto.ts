import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ 
    description: 'Rating value (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4.5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating_value: number;

  @ApiProperty({ 
    description: 'Review comment',
    example: 'Great experience! Highly recommended.'
  })
  @IsString()
  comment: string;

  @ApiPropertyOptional({ 
    description: 'Booking ID (optional - omit this field for simple package reviews)',
    example: 'cmdl7t1xm0000jvmw6x6iufmt',
    required: false
  })
  @IsOptional()
  @IsString()
  booking_id?: string;
}
