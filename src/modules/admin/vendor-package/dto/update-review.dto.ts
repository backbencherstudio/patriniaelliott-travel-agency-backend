import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({ 
    description: 'Rating value (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4.5
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating_value?: number;

  @ApiPropertyOptional({ 
    description: 'Review comment',
    example: 'Great experience! Highly recommended.'
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
