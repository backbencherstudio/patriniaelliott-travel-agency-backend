import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateFeedbackDto {
  @ApiProperty({
    description: 'Updated rating value (1-5 stars)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating_value?: number;

  @ApiProperty({
    description: 'Updated feedback comment/review text',
    example: 'Updated review: The hotel was excellent and exceeded expectations!',
    required: false
  })
  @IsOptional()
  @IsString()
  comment?: string;
} 