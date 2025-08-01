import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsDecimal, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for Package Room Type
export class PackageRoomTypeDto {
  @ApiProperty({ required: true })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_guests?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  size_sqm?: number;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  beds?: any;

  @ApiProperty({ required: true })
  price: any; // Use string or Decimal type

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  room_photos?: any;
}

// DTO for Package Availability
export class PackageAvailabilityDto {
  @ApiProperty({ required: true })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({ required: true })
  @IsString()
  status: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  rates?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  restrictions?: any;
}

// Clean DTO with only Package model fields
export class CreateVendorPackageDto {
  @ApiProperty({ required: true })
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  price: any; // Use string or Decimal type

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  duration_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellation_policy_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_guests?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  size_sqm?: number;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  beds?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  amenities?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  breakfast_available?: boolean;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  parking?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  house_rules?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  check_in?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  check_out?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  booking_method?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  commission_rate?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  host_earnings?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  rate_plans?: any;

  // Nested DTOs for room types and availabilities
  @ApiProperty({ required: false, type: [PackageRoomTypeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageRoomTypeDto)
  package_room_types?: PackageRoomTypeDto[];

  @ApiProperty({ required: false, type: [PackageAvailabilityDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageAvailabilityDto)
  package_availabilities?: PackageAvailabilityDto[];
}
