import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetUserDashboardDto {
  @ApiProperty({ 
    description: 'Filter by date range - start date', 
    required: false,
    example: '2024-01-01'
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ 
    description: 'Filter by date range - end date', 
    required: false,
    example: '2024-12-31'
  })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiProperty({ 
    description: 'Filter by booking type', 
    enum: ['hotel', 'tour', 'apartment'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['hotel', 'tour', 'apartment'])
  type?: string;
}
