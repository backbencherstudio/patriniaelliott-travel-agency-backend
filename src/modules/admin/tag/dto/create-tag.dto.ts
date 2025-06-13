import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Tag name',
    example: 'Hotel Accommodation',
  })
  name: string;
}
