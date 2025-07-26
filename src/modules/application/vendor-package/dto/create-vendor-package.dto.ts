import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsDecimal, IsArray } from 'class-validator';

export class CreateVendorPackageDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  created_at?: Date;

  @ApiProperty()
  @IsOptional()
  @IsDate()
  updated_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  deleted_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  approved_at?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  price: any; // Use string or Decimal type if you have a custom scalar

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

  // Relations (arrays) are omitted in DTO for creation unless you want to accept nested creates

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

  // Host Profile Fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_property?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  property_details?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_host?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  host_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  about_host?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_neighborhood?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  neighborhood_details?: string;

  // Related IDs for filtering
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category_ids?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tag_ids?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destination_ids?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  language_ids?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  traveller_type_ids?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extra_service_ids?: string[];

  // Price range filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_price?: number;

  // Duration filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_duration?: number;

  // Capacity filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_capacity_filter?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_capacity_filter?: number;

  // Date filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  available_from?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  available_until?: Date;

  // Status filters
  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  status_list?: number[];

  // Location filters
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  // Property type filters
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  property_types?: string[];

  // Amenity filters
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_amenities?: string[];

  // Room filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_max_guests?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_max_guests?: number;

  // Size filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_size_sqm?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_size_sqm?: number;

  // Booking method filter
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  booking_methods?: string[];

  // Commission rate filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_commission_rate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_commission_rate?: number;

  // Host earnings filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  min_host_earnings?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_host_earnings?: number;

  // Approval status filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  approved_from?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  approved_until?: Date;

  // Created/Updated date filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  created_from?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  created_until?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  updated_from?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  updated_until?: Date;

  // Search filters
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search_term?: string;

  // Sort options
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sort_order?: string; // 'asc' or 'desc'

  // Pagination
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
