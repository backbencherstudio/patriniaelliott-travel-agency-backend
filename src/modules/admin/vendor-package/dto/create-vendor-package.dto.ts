import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsDecimal, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { array } from 'zod';

// DTO for Amenities
export class AmenitiesDto {
  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  general?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  cooking_cleaning?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  entertainment?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  outside_view?: any;
}

// DTO for Parking
export class ParkingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  reserve_parking_spot?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  parking_located?: any;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  parking_type?: any;
}

// DTO for House Rules
export class HouseRulesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  no_smoking?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  parties_allowed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  no_pets?: boolean;
}

// DTO for Check In
export class CheckInDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructions?: string;
}

// DTO for Rate Plans
export class RatePlanDto {
  @ApiProperty({ required: false })
  @IsOptional()
  price?: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RatePlansDto {
  @ApiProperty({ required: false, type: RatePlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RatePlanDto)
  standard?: RatePlanDto;

  @ApiProperty({ required: false, type: RatePlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RatePlanDto)
  peak?: RatePlanDto;
}

// DTO for Extra Service
export class ExtraServiceDto {
  @ApiProperty({ required: true, description: 'Name of the extra service' })
  @IsString()
  name: string;

  @ApiProperty({ required: true, description: 'Price of the extra service' })
  @IsNumber()
  price: number;

  @ApiProperty({ required: false, description: 'Currency for the service price', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, description: 'Description of the extra service' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Whether the service is available', default: true })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}

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

  @ApiProperty({ required: false, type: array })
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

// Enhanced DTO with proper nested structures
export class CreateVendorPackageDto {
  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: true })
  @IsOptional()
  price?: any; // Use string or Decimal type

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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  })
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

  @ApiProperty({ required: false, type: AmenitiesDto })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => AmenitiesDto)
  amenities?: AmenitiesDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  breakfast_available?: boolean;

  @ApiProperty({ required: false, type: ParkingDto })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => ParkingDto)
  parking?: ParkingDto;

  @ApiProperty({ required: false, type: HouseRulesDto })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => HouseRulesDto)
  house_rules?: HouseRulesDto;

  @ApiProperty({ required: false, type: CheckInDto })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => CheckInDto)
  check_in?: CheckInDto;

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

  @ApiProperty({ required: false, type: RatePlansDto })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @ValidateNested()
  @Type(() => RatePlansDto)
  rate_plans?: RatePlansDto;

  // Nested DTOs for room types and availabilities
  @ApiProperty({ required: false, type: [PackageRoomTypeDto] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageRoomTypeDto)
  package_room_types?: PackageRoomTypeDto[];

  @ApiProperty({ required: false, type: [PackageAvailabilityDto] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageAvailabilityDto)
  package_availabilities?: PackageAvailabilityDto[];

  @ApiProperty({ required: false, type: [ExtraServiceDto], description: 'Array of extra services with prices' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraServiceDto)
  extra_services?: ExtraServiceDto[];

  @ApiProperty({ required: false, description: 'Calendar start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  calendar_start_date?: Date;

  @ApiProperty({ required: false, description: 'Calendar end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  calendar_end_date?: Date;

  @ApiProperty({ required: false, description: 'Initialize calendar automatically', default: true })
  @IsOptional()
  @IsBoolean()
  initialize_calendar?: boolean = true;

  @ApiProperty({ required: false, description: 'Close specific dates', type: [Date] })
  @IsOptional()
  @IsArray()
  @Type(() => Date)
  close_dates?: Date[];

  @ApiProperty({ required: false, description: 'Close date ranges', type: [Object] })
  @IsOptional()
  @IsArray()
  close_date_ranges?: Array<{
    start_date: Date;
    end_date: Date;
    reason?: string;
  }>;
}

