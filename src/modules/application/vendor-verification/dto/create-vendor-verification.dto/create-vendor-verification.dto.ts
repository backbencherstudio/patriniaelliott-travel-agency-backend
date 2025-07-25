import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEmail, IsDate, IsNumber } from 'class-validator';

export class CreateVendorVerificationDto {
  @IsNotEmpty()
  @ApiProperty()
  first_name: string;

  @IsNotEmpty()
  @ApiProperty()
  phone_number: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  business_website?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  vendor_type?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  TIN?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  property_name?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  address?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  unit_number?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  postal_code?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  city?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  country?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  owner_type?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  owner_first_name?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  owner_last_name?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  owner_phone_numbers?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  owner_alt_names?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  manager_name?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsBoolean()
  is_govt_representation?: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  payment_method?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsEmail()
  payment_email?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  payment_account_name?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  payment_TIN?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  billing_address?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  status?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsNumber()
  step?: number;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  rejection_reason?: string;

  @IsOptional()
  @ApiProperty({ required: false, type: String, format: 'date-time' })
  @IsDate()
  verified_at?: Date;
}
