import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Booking ID to pay for',
    example: 'clx1234567890abcdef'
  })
  @IsNotEmpty()
  @IsString()
  booking_id: string;

  @ApiProperty({
    description: 'Payment method ID from Stripe',
    example: 'pm_1234567890abcdef'
  })
  @IsNotEmpty()
  @IsString()
  payment_method_id: string;

  @ApiProperty({
    description: 'Amount to pay (in cents)',
    example: 700000
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    default: 'usd'
  })
  @IsOptional()
  @IsString()
  currency?: string = 'usd';

  @ApiProperty({
    description: 'Customer email for receipt',
    example: 'sadman@gmail.com'
  })
  @IsOptional()
  @IsString()
  customer_email?: string;
}

export class PaymentIntentResponseDto {
  @ApiProperty()
  client_secret: string;

  @ApiProperty()
  payment_intent_id: string;

  @ApiProperty()
  status: string;
} 