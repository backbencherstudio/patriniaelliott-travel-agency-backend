import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsArray, ValidateNested, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidatedPricingRuleDto } from './PricingRuleDto.dto';
import { IsValidDateRange } from '../validators/pricing-rules.validator';

export class UpdatePricingRulesDto {
  @ApiProperty({
    required: true,
    description: 'Updated pricing rules for the package',
    type: ValidatedPricingRuleDto
  })
  @ValidateNested()
  @Type(() => ValidatedPricingRuleDto)
  pricing_rules: ValidatedPricingRuleDto;

  @ApiProperty({
    required: false,
    description: 'Whether to recompute future calendar prices with new rules',
    default: true
  })
  @IsOptional()
  @IsBoolean()
  recompute_calendar?: boolean = true;

  @ApiProperty({
    required: false,
    description: 'Start date for calendar recomputation (defaults to today)',
    example: '2025-10-01'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  recompute_start_date?: Date;

  @ApiProperty({
    required: false,
    description: 'End date for calendar recomputation (defaults to 12 months from start)',
    example: '2026-10-01'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  recompute_end_date?: Date;
}
