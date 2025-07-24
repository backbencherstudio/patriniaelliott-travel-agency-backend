import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorVerificationDto {
  @ApiProperty({
    description: 'First name of the vendor.',
    example: 'Elisabeth',
  })
  first_name: string;

  @ApiProperty({
    description: 'Phone number of the vendor.',
    example: '(765) 322-1399',
  })
  phone_number: string;

  @ApiProperty({
    description: 'Business website (optional).',
    example: 'https://mycooltravel.com',
    required: false,
  })
  business_website?: string;

  @ApiProperty({
    description: 'Type of vendor.',
    example: 'Property Manager',
  })
  vendor_type: string;

  @ApiProperty({
    description: 'Business Tax Identification Number (TIN).',
    example: '12-3456789',
  })
  TIN: string;
}
