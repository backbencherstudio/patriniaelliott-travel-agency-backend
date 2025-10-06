import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserBookingsDto {
  @ApiProperty({ 
    description: 'Page number for pagination', 
    default: 1, 
    minimum: 1,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page', 
    default: 10, 
    minimum: 1, 
    maximum: 100,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Filter by booking status', 
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['pending', 'approved', 'rejected', 'cancelled', 'completed'])
  status?: string;

  @ApiProperty({ 
    description: 'Filter by booking type', 
    enum: ['hotel', 'tour', 'apartment'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['hotel', 'tour', 'apartment'])
  type?: string;

  @ApiProperty({ 
    description: 'Search query for booking details', 
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Sort by field', 
    enum: ['created_at', 'booking_date_time', 'total_amount'],
    default: 'created_at',
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['created_at', 'booking_date_time', 'total_amount'])
  sort_by?: string = 'created_at';

  @ApiProperty({ 
    description: 'Sort order', 
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}
