import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEmail, IsDateString } from 'class-validator';

export class UpdateVendorVerificationDto {
  @ApiProperty({ 
    description: 'First name of the vendor',
    example: 'John',
    required: false 
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ 
    description: 'Phone number of the vendor',
    example: '+1234567890',
    required: false 
  })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ 
    description: 'Business website URL',
    example: 'https://example.com',
    required: false 
  })
  @IsOptional()
  @IsString()
  business_website?: string;

  @ApiProperty({ 
    description: 'Type of vendor (individual, company, etc.)',
    example: 'individual',
    required: false 
  })
  @IsOptional()
  @IsString()
  vendor_type?: string;

  @ApiProperty({ 
    description: 'Tax Identification Number',
    example: 'TIN123456789',
    required: false 
  })
  @IsOptional()
  @IsString()
  TIN?: string;

  @ApiProperty({ 
    description: 'Property name',
    example: 'Grand Hotel',
    required: false 
  })
  @IsOptional()
  @IsString()
  property_name?: string;

  @ApiProperty({ 
    description: 'Business address',
    example: '123 Main Street',
    required: false 
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    description: 'Unit number',
    example: 'Suite 100',
    required: false 
  })
  @IsOptional()
  @IsString()
  unit_number?: string;

  @ApiProperty({ 
    description: 'Postal code',
    example: '12345',
    required: false 
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({ 
    description: 'City',
    example: 'New York',
    required: false 
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ 
    description: 'Country',
    example: 'United States',
    required: false 
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    description: 'Owner type',
    example: 'individual',
    required: false 
  })
  @IsOptional()
  @IsString()
  owner_type?: string;

  @ApiProperty({ 
    description: 'Owner first name',
    example: 'Jane',
    required: false 
  })
  @IsOptional()
  @IsString()
  owner_first_name?: string;

  @ApiProperty({ 
    description: 'Owner last name',
    example: 'Smith',
    required: false 
  })
  @IsOptional()
  @IsString()
  owner_last_name?: string;

  @ApiProperty({ 
    description: 'Owner phone numbers',
    example: '+1234567890, +0987654321',
    required: false 
  })
  @IsOptional()
  @IsString()
  owner_phone_numbers?: string;

  @ApiProperty({ 
    description: 'Owner alternative names',
    example: 'Johnny, J. Smith',
    required: false 
  })
  @IsOptional()
  @IsString()
  owner_alt_names?: string;

  @ApiProperty({ 
    description: 'Manager name',
    example: 'Mike Johnson',
    required: false 
  })
  @IsOptional()
  @IsString()
  manager_name?: string;

  @ApiProperty({ 
    description: 'Is government representation',
    example: false,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  is_govt_representation?: boolean;

  @ApiProperty({ 
    description: 'Payment method',
    example: 'bank_transfer',
    required: false 
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiProperty({ 
    description: 'Payment email',
    example: 'payments@example.com',
    required: false 
  })
  @IsOptional()
  @IsEmail()
  payment_email?: string;

  @ApiProperty({ 
    description: 'Payment account name',
    example: 'John Smith Business Account',
    required: false 
  })
  @IsOptional()
  @IsString()
  payment_account_name?: string;

  @ApiProperty({ 
    description: 'Payment TIN',
    example: 'PAY123456789',
    required: false 
  })
  @IsOptional()
  @IsString()
  payment_TIN?: string;

  @ApiProperty({ 
    description: 'Billing address',
    example: '456 Billing Street, Suite 200',
    required: false 
  })
  @IsOptional()
  @IsString()
  billing_address?: string;

  @ApiProperty({ 
    description: 'Verification status',
    example: 'pending',
    enum: ['pending', 'approved', 'rejected'],
    required: false 
  })
  @IsOptional()
  @IsString()
  status?: string;

  // User table fields
  @ApiProperty({ 
    description: 'User email address',
    example: 'user@example.com',
    required: false 
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    description: 'User full name',
    example: 'John Doe',
    required: false 
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'User last name',
    example: 'Doe',
    required: false 
  })
  @IsOptional()
  @IsString()
  last_name?: string;


  @ApiProperty({ 
    description: 'User zip code',
    example: '12345',
    required: false 
  })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ 
    description: 'User gender',
    example: 'Male',
    required: false 
  })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ 
    description: 'User date of birth',
    example: '1990-01-01',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ 
    description: 'User nationality',
    example: 'American',
    required: false 
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiProperty({ 
    description: 'User passport number',
    example: 'A1234567',
    required: false 
  })
  @IsOptional()
  @IsString()
  passport_number?: string;

  @ApiProperty({ 
    description: 'User passport first name',
    example: 'John',
    required: false 
  })
  @IsOptional()
  @IsString()
  passport_first_name?: string;

  @ApiProperty({ 
    description: 'User passport last name',
    example: 'Doe',
    required: false 
  })
  @IsOptional()
  @IsString()
  passport_last_name?: string;

  @ApiProperty({ 
    description: 'User passport issuing country',
    example: 'United States',
    required: false 
  })
  @IsOptional()
  @IsString()
  passport_issuing_country?: string;

  @ApiProperty({ 
    description: 'User passport expiry date',
    example: '2030-01-01',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  passport_expiry_date?: string;

  @ApiProperty({ 
    description: 'User street address',
    example: '123 Main Street',
    required: false 
  })
  @IsOptional()
  @IsString()
  street_address?: string;

  @ApiProperty({ 
    description: 'User apartment/suite/unit',
    example: 'Apt 4B',
    required: false 
  })
  @IsOptional()
  @IsString()
  apt_suite_unit?: string;

  @ApiProperty({ 
    description: 'User display name',
    example: 'Johnny',
    required: false 
  })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiProperty({ 
    description: 'User state',
    example: 'New York',
    required: false 
  })
  @IsOptional()
  @IsString()
  state?: string;
}
