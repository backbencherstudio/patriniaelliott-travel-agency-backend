// src/modules/application/package/dto/search-packages.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDate, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchPackagesDto {
  @ApiProperty({ required: false, description: 'Search term for package name/description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Destination ID' })
  @IsOptional()
  @IsString()
  destination_id?: string;

  @ApiProperty({ required: false, description: 'Category ID' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ required: false, description: 'Check-in date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiProperty({ required: false, description: 'Check-out date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiProperty({ required: false, minimum: 1, description: 'Number of adults' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  adults?: number;

  @ApiProperty({ required: false, minimum: 0, description: 'Number of children' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number;

  @ApiProperty({ required: false, minimum: 0, description: 'Number of infants' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  infants?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 10, description: 'Number of rooms' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rooms?: number;

  @ApiProperty({ required: false, minimum: 0, description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiProperty({ required: false, minimum: 0, description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiProperty({ required: false, description: 'Traveller type IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  traveller_types?: string;

  @ApiProperty({ required: false, description: 'Tag IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiProperty({ required: false, minimum: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, minimum: 1, maximum: 50, default: 10, description: 'Items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ required: false, enum: ['price_asc', 'price_desc', 'rating_desc', 'created_at_desc'], default: 'created_at_desc' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at_desc';
}