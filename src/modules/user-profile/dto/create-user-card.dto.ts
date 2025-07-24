import { ApiProperty } from '@nestjs/swagger';

export class CreateUserCardDto {
  @ApiProperty({ description: 'Card number', example: '3897 222X 1900 3890' })
  card_number: string;

  @ApiProperty({ description: 'Expiry month (MM)', example: 12 })
  expiry_month: number;

  @ApiProperty({ description: 'Expiry year (YYYY)', example: 2030 })
  expiry_year: number;

  @ApiProperty({ description: 'CVV', example: '123' })
  cvv: string;

  // Optional billing address fields (fallback to user profile if omitted)
  @ApiProperty({ description: 'Billing country', required: false, example: 'United States' })
  billing_country?: string;

  @ApiProperty({ description: 'Billing street address', required: false, example: '123 Main St' })
  billing_street_address?: string;

  @ApiProperty({ description: 'Billing apt/suite/unit', required: false, example: 'Apt 4B' })
  billing_apt_suite_unit?: string;

  @ApiProperty({ description: 'Billing state / province / region', required: false, example: 'NY' })
  billing_state?: string;

  @ApiProperty({ description: 'Billing city', required: false, example: 'New York' })
  billing_city?: string;

  @ApiProperty({ description: 'Billing zip / postal code', required: false, example: '10001' })
  billing_zip_code?: string;
} 