import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDate, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsValidDateRange } from '../validators/pricing-rules.validator';

export class RecomputeCalendarDto {
  @ApiProperty({
    required: false,
    description: 'Start date for calendar recomputation (defaults to today)',
    example: '2025-10-01'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiProperty({
    required: false,
    description: 'End date for calendar recomputation (defaults to 12 months from start)',
    example: '2026-10-01'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiProperty({
    required: false,
    description: 'Room type ID to recompute (optional, recomputes all if not provided)',
    example: 'room-type-123'
  })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiProperty({
    required: false,
    description: 'Whether to preserve existing price overrides (defaults to true)',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  preserve_overrides?: boolean = true;
}
