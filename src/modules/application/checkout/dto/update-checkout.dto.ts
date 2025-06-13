import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCheckoutDto } from './create-checkout.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCheckoutDto extends PartialType(CreateCheckoutDto) {
  // @ApiProperty({
  //   description: 'The coupons,  data format: ICoupon[], in stringified format',
  // })
  // coupons: any;

  // contact details
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The phone number',
    example: '+233543212345',
  })
  phone_number?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'The address1 for flat, house no, building, company, apartment',
    example: '123 Main St, Accra, Ghana',
  })
  address1?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The address2 for area, colony, street, sector, village',
    example: 'Accra, Ghana',
  })
  address2?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The city',
    example: 'Accra',
  })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The zip code',
    example: '123456',
  })
  zip_code?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The state',
    example: 'Greater Accra',
  })
  state?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The country',
    example: 'Ghana',
  })
  country?: string;

  @IsOptional()
  @ApiProperty({
    description: 'The payment method',
  })
  payment_methods?: any;
}
