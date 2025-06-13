import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class QueryPackageDto {
  @IsOptional()
  @ApiProperty()
  q?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  duration_start?: string;

  @IsOptional()
  duration_end?: string;

  @IsOptional()
  budget_start?: number;

  @IsOptional()
  budget_end?: number;

  @IsOptional()
  @Type(() => Number)
  ratings?: number[];

  @IsOptional()
  @Type(() => String)
  @IsString({ each: true })
  free_cancellation?: string[];

  @IsOptional()
  @Type(() => String)
  @IsString({ each: true })
  destinations?: string[];

  @IsOptional()
  @Type(() => String)
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  limit?: number;

  // cursor based pagination
  @IsOptional()
  cursor?: string;

  // offset based pagination
  @IsOptional()
  page?: number;
}
