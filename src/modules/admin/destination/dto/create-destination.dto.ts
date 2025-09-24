import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsJSON } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDestinationDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Destination name',
    example: 'Paris',
  })
  name: string;

 

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Country name',
    example: 'France',
  })
  country_name: string;

  @ApiProperty({
    required: false,
    description: 'State/Province name',
    example: 'Île-de-France',
  })
  @IsOptional()
  @IsString()
  state?: string;

  

  @ApiProperty({
    required: false,
    description: 'Duration type (e.g., days, hours)',
    example: 'days',
  })
  @IsOptional()
  @IsString()
  duration_type?: string;

 
}
