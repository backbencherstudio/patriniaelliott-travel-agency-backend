import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDate, IsObject, IsArray, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Enum for calendar status
export enum CalendarStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  CLOSED = 'closed',
  MAINTENANCE = 'maintenance'
}

// DTO for Calendar Query Parameters
export class CalendarQueryDto {
  @ApiProperty({ required: false, description: 'Month in YYYY-MM format', example: '2023-05' })
  @IsOptional()
  @IsString()
  calendar_month?: string;

  @ApiProperty({ required: false, description: 'Include calendar data' })
  @IsOptional()
  @IsBoolean()
  include_calendar?: boolean = false;

  @ApiProperty({ required: false, description: 'Room type ID for specific calendar' })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiProperty({ required: false, description: 'Start date for availability range' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  availability_start?: Date;

  @ApiProperty({ required: false, description: 'End date for availability range' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  availability_end?: Date;
}

// DTO for Single Date Update
export class SingleDateUpdateDto {
  @ApiProperty({ required: true, description: 'Date to update' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ required: true, enum: CalendarStatus, description: 'Calendar status' })
  @IsNotEmpty()
  @IsEnum(CalendarStatus)
  status: CalendarStatus;

  @ApiProperty({ required: false, description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false, description: 'Room type ID' })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiProperty({ required: false, description: 'Custom price for this date' })
  @IsOptional()
  @IsNumber()
  price?: number;
}

// DTO for Bulk Date Range Update
export class BulkDateRangeUpdateDto {
  @ApiProperty({ required: true, description: 'Start date for update' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({ required: true, description: 'End date for update' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @ApiProperty({ required: true, enum: CalendarStatus, description: 'Calendar status' })
  @IsNotEmpty()
  @IsEnum(CalendarStatus)
  status: CalendarStatus;

  @ApiProperty({ required: false, description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false, description: 'Room type ID' })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiProperty({ required: false, description: 'Custom price for these dates' })
  @IsOptional()
  @IsNumber()
  price?: number;
}

// DTO for Calendar Initialization
export class CalendarInitDto {
  @ApiProperty({ required: true, description: 'Start date for calendar' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({ required: true, description: 'End date for calendar' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @ApiProperty({ required: false, description: 'Room type ID' })
  @IsOptional()
  @IsString()
  room_type_id?: string;
}
