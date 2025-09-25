import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsBoolean, IsNumber } from 'class-validator';

// DTO for User Document - Following UserDocument schema
export class UserDocumentDto {
  @ApiProperty({ 
    required: true, 
    description: 'Type of document (e.g., passport, driver_license, business_license, etc.)',
    example: 'passport'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ 
    required: false, 
    description: 'phone number',
    example: '017483****4'
  })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiProperty({ 
    required: false, 
    description: 'Status of document verification',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  @IsOptional()
  @IsString()
  status?: string;

  // Note: image field will be handled by file upload, not in DTO
}

// DTO for Vendor Verification Registration
export class VendorVerificationDto {
  // Personal Information
  @ApiProperty({ description: 'First name of the vendor' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Email address of the vendor' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number of the vendor' })
  @IsString()
  phone_number: string;

  @ApiProperty({ description: 'Password for the vendor account' })
  @IsString()
  password: string;

  // Business Details
  @ApiPropertyOptional({ description: 'Business website URL (optional)' })
  @IsOptional()
  @IsString()
  business_website?: string;

  @ApiProperty({ description: 'Type of vendor (e.g., Property Manager, Hotel Owner, etc.)' })
  @IsString()
  vendor_type: string;

  @ApiProperty({ description: 'Business Tax Identification Number' })
  @IsString()
  TIN: string;

  // Additional Business Information (optional)
  @ApiPropertyOptional({ description: 'Property name' })
  @IsOptional()
  @IsString()
  property_name?: string;

  @ApiPropertyOptional({ description: 'Business address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Unit number' })
  @IsOptional()
  @IsString()
  unit_number?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Owner type' })
  @IsOptional()
  @IsString()
  owner_type?: string;

  @ApiPropertyOptional({ description: 'Owner first name' })
  @IsOptional()
  @IsString()
  owner_first_name?: string;

  @ApiPropertyOptional({ description: 'Owner last name' })
  @IsOptional()
  @IsString()
  owner_last_name?: string;

  @ApiPropertyOptional({ description: 'Owner phone numbers' })
  @IsOptional()
  @IsString()
  owner_phone_numbers?: string;

  @ApiPropertyOptional({ description: 'Owner alternative names' })
  @IsOptional()
  @IsString()
  owner_alt_names?: string;

  @ApiPropertyOptional({ description: 'Manager name' })
  @IsOptional()
  @IsString()
  manager_name?: string;

  @ApiPropertyOptional({ description: 'Is government representation' })
  @IsOptional()
  @IsBoolean()
  is_govt_representation?: boolean;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ description: 'Payment email' })
  @IsOptional()
  @IsEmail()
  payment_email?: string;

  @ApiPropertyOptional({ description: 'Payment account name' })
  @IsOptional()
  @IsString()
  payment_account_name?: string;

  @ApiPropertyOptional({ description: 'Payment TIN' })
  @IsOptional()
  @IsString()
  payment_TIN?: string;

  @ApiPropertyOptional({ description: 'Billing address' })
  @IsOptional()
  @IsString()
  billing_address?: string;
}


