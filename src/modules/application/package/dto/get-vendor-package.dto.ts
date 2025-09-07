import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

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

  @ApiProperty({ required: false, description: 'Search by country name' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, description: 'Search by location/city name' })
  @IsOptional()
  @IsString()
  location?: string;

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

  @ApiProperty({ required: false, description: 'Package type filter (tour, accommodation, etc.)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false, description: 'Free cancellation filter' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  free_cancellation?: boolean;

  @ApiProperty({ required: false, description: 'Languages filter (array of language IDs)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ required: false, description: 'Rating filter (single rating or array of ratings)', example: [4, 5] })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => Number(v));
    }
    return [Number(value)];
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(5, { each: true })
  ratings?: number[];

  @ApiProperty({ required: false, description: 'Maximum budget filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget_end?: number;

  @ApiProperty({ required: false, description: 'Minimum budget filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget_start?: number;

  @ApiProperty({ required: false, description: 'Start date for availability filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  duration_start?: string;

  @ApiProperty({ required: false, description: 'End date for availability filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  duration_end?: string;
}
