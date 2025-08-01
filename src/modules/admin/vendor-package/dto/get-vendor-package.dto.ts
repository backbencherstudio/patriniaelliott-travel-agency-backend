import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetVendorPackageDto {
  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ required: false, description: 'Search query for package name/description' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, description: 'Package status filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @ApiProperty({ required: false, description: 'Category ID filter' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ required: false, description: 'Destination ID filter' })
  @IsOptional()
  @IsString()
  destination_id?: string;
}
