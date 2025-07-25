import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsDecimal } from 'class-validator';

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
}
