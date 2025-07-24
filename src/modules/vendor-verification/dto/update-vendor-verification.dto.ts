import { ApiProperty } from '@nestjs/swagger';

export class UpdateVendorVerificationDto {
  @ApiProperty({ required: false })
  property_name?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  unit_number?: string;

  @ApiProperty({ required: false })
  postal_code?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  owner_type?: string;

  @ApiProperty({ required: false })
  owner_first_name?: string;

  @ApiProperty({ required: false })
  owner_last_name?: string;

  @ApiProperty({ required: false })
  owner_phone_numbers?: string;

  @ApiProperty({ required: false })
  owner_alt_names?: string;

  @ApiProperty({ required: false })
  manager_name?: string;

  @ApiProperty({ required: false })
  is_govt_representation?: boolean;

  @ApiProperty({ required: false })
  payment_method?: string;

  @ApiProperty({ required: false })
  payment_email?: string;

  @ApiProperty({ required: false })
  payment_account_name?: string;

  @ApiProperty({
    description: 'Tax ID for payment (e.g., VAT ID).',
    required: false,
  })
  payment_TIN?: string;

  @ApiProperty({ required: false })
  billing_address?: string;

  @ApiProperty({
    description: 'The current step of the verification process being submitted.',
    example: 2,
    required: false,
  })
  step?: number;
}
