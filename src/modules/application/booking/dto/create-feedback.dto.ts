import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    description: 'Booking ID for which feedback is being provided',
    example: 'booking_abc123'
  })
  @IsNotEmpty()
  @IsString()
  booking_id: string;

  @ApiProperty({
    description: 'Rating value (1-5 stars)',
    example: 4.5,
    minimum: 1,
    maximum: 5
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating_value: number;

  @ApiProperty({
    description: 'Feedback comment/review text',
    example: 'Great experience! The hotel was clean and staff was friendly.',
    required: false
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Package ID (optional, will be auto-filled from booking)',
    example: 'package_xyz789',
    required: false
  })
  @IsOptional()
  @IsString()
  package_id?: string;
} 