import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsObject, IsArray, IsDateString } from 'class-validator';

export class UpdateListingManagementDto {
  @ApiProperty({ description: 'Package name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Package description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Package price', required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Package duration', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: 'Duration type (days, hours, etc.)', required: false })
  @IsOptional()
  @IsString()
  duration_type?: string;

  @ApiProperty({ description: 'Minimum capacity', required: false })
  @IsOptional()
  @IsNumber()
  min_capacity?: number;

  @ApiProperty({ description: 'Maximum capacity', required: false })
  @IsOptional()
  @IsNumber()
  max_capacity?: number;

  @ApiProperty({ description: 'Package type (apartment, hotel, tour)', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Package address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Package amenities', required: false })
  @IsOptional()
  @IsObject()
  amenities?: any;

  @ApiProperty({ description: 'Number of bathrooms', required: false })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiProperty({ description: 'Number of bedrooms', required: false })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiProperty({ description: 'Bed configuration', required: false })
  @IsOptional()
  @IsObject()
  beds?: any;

  @ApiProperty({ description: 'Booking method', required: false })
  @IsOptional()
  @IsString()
  booking_method?: string;

  @ApiProperty({ description: 'Breakfast available', required: false })
  @IsOptional()
  @IsBoolean()
  breakfast_available?: boolean;

  @ApiProperty({ description: 'Check-in information', required: false })
  @IsOptional()
  @IsObject()
  check_in?: any;

  @ApiProperty({ description: 'Check-out information', required: false })
  @IsOptional()
  @IsObject()
  check_out?: any;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Commission rate', required: false })
  @IsOptional()
  @IsNumber()
  commission_rate?: number;

  @ApiProperty({ description: 'Host earnings', required: false })
  @IsOptional()
  @IsNumber()
  host_earnings?: number;

  @ApiProperty({ description: 'House rules', required: false })
  @IsOptional()
  @IsObject()
  house_rules?: any;

  @ApiProperty({ description: 'Latitude', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Maximum guests', required: false })
  @IsOptional()
  @IsNumber()
  max_guests?: number;

  @ApiProperty({ description: 'Parking information', required: false })
  @IsOptional()
  @IsObject()
  parking?: any;

  @ApiProperty({ description: 'Postal code', required: false })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({ description: 'Rate plans', required: false })
  @IsOptional()
  @IsObject()
  rate_plans?: any;

  @ApiProperty({ description: 'Size in square meters', required: false })
  @IsOptional()
  @IsNumber()
  size_sqm?: number;

  @ApiProperty({ description: 'Unit number', required: false })
  @IsOptional()
  @IsString()
  unit_number?: string;

  @ApiProperty({ description: 'Non-refundable days', required: false })
  @IsOptional()
  @IsObject()
  non_refundable_days?: any;

  @ApiProperty({ description: 'Package status (0 = inactive, 1 = active)', required: false })
  @IsOptional()
  @IsNumber()
  status?: number;
}
