import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreatePackageCancellationPolicyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Cancellation policy',
    example: 'free_cancellation',
  })
  policy: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Cancellation policy description',
    example: 'Free cancellation policy',
  })
  description: string;
}
