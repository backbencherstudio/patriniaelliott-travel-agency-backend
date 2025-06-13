import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSocialMediaDto {
  @IsString()
  @ApiProperty({
    description: 'Social media name',
    example: 'facebook',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: 'Social media url',
    example: 'https://www.facebook.com',
  })
  url: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Social media icon',
    example: 'https://www.facebook.com/favicon.ico',
  })
  icon?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Social media sort order',
    example: 1,
  })
  sort_order?: number;
}
