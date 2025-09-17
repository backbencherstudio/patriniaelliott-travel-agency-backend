import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserCardDto {
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string
}
