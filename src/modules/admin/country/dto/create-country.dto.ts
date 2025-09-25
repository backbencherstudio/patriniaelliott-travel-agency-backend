import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country name', example: 'France' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Country flag image path or URL', example: 'flags/fr.png', required: false })
  @IsOptional()
  @IsString()
  flag?: string;

  @ApiProperty({ description: 'ISO Alpha-2/3 country code', example: 'FR', required: false })
  @IsOptional()
  @IsString()
  country_code?: string;

  @ApiProperty({ description: 'Dialing code with + prefix', example: '+33', required: false })
  @IsOptional()
  @IsString()
  dial_code?: string;
}
