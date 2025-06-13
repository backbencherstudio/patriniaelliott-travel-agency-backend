import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export interface IBookingTraveller {
  full_name: string;
  type: string;
}

export interface IPaymentMethod {
  id?: string;
  number?: string;
  name?: string;
  expiry_date?: string;
  // exp_month?: number;
  // exp_year?: number;
  cvc?: string;
}

export interface ICoupon {
  code: string;
}

export interface IExtraService {
  id: string;
}

export class CreateCheckoutDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The id of the package',
  })
  package_id: string;

  @ApiProperty()
  included_packages: string;

  @ApiProperty()
  excluded_packages: string;

  @IsOptional()
  // @IsString()
  @ApiProperty({
    description: 'The booking travellers',
  })
  booking_travellers: any;

  @ApiProperty()
  extra_services: any;

  @ApiProperty()
  start_date: Date;

  @ApiProperty()
  end_date: Date;
}
