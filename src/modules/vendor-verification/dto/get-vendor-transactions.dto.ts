import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class GetVendorTransactionsDto {
  @ApiProperty({
    description: 'Page number for pagination.',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Filter by transaction type.',
    enum: ['all', 'bookings', 'refunds', 'withdrawal'],
    required: false,
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'bookings', 'refunds', 'withdrawal'])
  type?: string = 'all';

  @ApiProperty({
    description: 'Filter by time period.',
    enum: ['all', 'last_7_days', 'last_30_days'],
    required: false,
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'last_7_days', 'last_30_days'])
  period?: string = 'all';
} 