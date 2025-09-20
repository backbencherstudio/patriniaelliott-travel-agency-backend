import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class ConfirmPaymentDto {
  @IsNotEmpty()
  @IsString()
  payment_method_id: string
}
