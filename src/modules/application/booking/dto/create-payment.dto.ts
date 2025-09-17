import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  booking_id: string

  @IsNotEmpty()
  @IsString()
  currency: string

  @IsNotEmpty()
  @IsString()
  provider: string
}

export class PaymentIntentResponseDto {
  @ApiProperty()
  client_secret: string;

  @ApiProperty()
  payment_intent_id: string;

  @ApiProperty()
  status: string;
} 