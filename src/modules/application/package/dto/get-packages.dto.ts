import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPackagesDto {
  @ApiProperty({
    description: 'Search query for package name or description',
    example: 'beach vacation',
    required: false,
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({
    description: 'Package type filter',
    example: 'tour',
    enum: ['tour', 'apartment', 'hotel'],
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Minimum duration filter',
    example: 3,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_start?: number;

  @ApiProperty({
    description: 'Maximum duration filter',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration_end?: number;

  @ApiProperty({
    description: 'Minimum price filter',
    example: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget_start?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budget_end?: number;

  @ApiProperty({
    description: 'Rating filter (array of ratings)',
    example: [4, 5],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  ratings?: number[];

  @ApiProperty({
    description: 'Free cancellation filter',
    example: ['free_cancellation'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  free_cancellation?: string[];

  @ApiProperty({
    description: 'Destination IDs filter',
    example: ['dest1', 'dest2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinations?: string[];

  @ApiProperty({
    description: 'Language IDs filter',
    example: ['lang1', 'lang2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort by field',
    example: 'price',
    enum: ['price', 'duration', 'created_at', 'name'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
} 