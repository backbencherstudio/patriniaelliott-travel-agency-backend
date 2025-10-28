import { IsArray, IsBoolean, IsDate, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested, Min, Max, ArrayMinSize, ArrayMaxSize, IsInt, ArrayUnique } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsValidPricingRules } from '../validators/pricing-rules.validator';

// 1) New DTO: Pricing rules
export class PricingRuleDto {
  @ApiProperty({ 
    required: true, 
    description: 'Base price for non-weekend days, before flat discount',
    minimum: 0,
    maximum: 10000,
    example: 35
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Base price must be at least $0' })
  @Max(10000, { message: 'Base price cannot exceed $10,000' })
  base_price: number;

  @ApiProperty({ 
    required: true, 
    description: 'Weekend price for selected weekend days, before flat discount',
    minimum: 0,
    maximum: 10000,
    example: 25
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Weekend price must be at least $0' })
  @Max(10000, { message: 'Weekend price cannot exceed $10,000' })
  weekend_price: number;

  @ApiProperty({ 
    required: true, 
    description: 'Flat discount applied to all days',
    minimum: 0,
    maximum: 1000,
    example: 1
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Flat discount must be at least $0' })
  @Max(1000, { message: 'Flat discount cannot exceed $1,000' })
  flat_discount: number;

  @ApiProperty({ 
    required: true, 
    description: 'Weekly discount percentage applied on bookings >= 7 nights (not per-day calendar)',
    minimum: 0,
    maximum: 50,
    example: 10
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0, { message: 'Weekly discount percentage must be at least 0%' })
  @Max(50, { message: 'Weekly discount percentage cannot exceed 50%' })
  weekly_discount_pct: number;

  @ApiProperty({ 
    required: true, 
    description: 'Weekend days as JS day numbers (0=Sun..6=Sat). E.g., [5,6] for Fri, Sat.',
    type: [Number],
    example: [5, 6],
    minItems: 0,
    maxItems: 7
  })
  @IsArray()
  @ArrayMinSize(0, { message: 'Weekend days array cannot be empty (use empty array for no weekends)' })
  @ArrayMaxSize(7, { message: 'Weekend days array cannot have more than 7 days' })
  @ArrayUnique({ message: 'Weekend days must be unique' })
  @IsInt({ each: true, message: 'Each weekend day must be an integer' })
  @Min(0, { each: true, message: 'Weekend days must be between 0-6 (0=Sunday, 6=Saturday)' })
  @Max(6, { each: true, message: 'Weekend days must be between 0-6 (0=Sunday, 6=Saturday)' })
  weekend_days: number[];

  @ApiProperty({ 
    required: true, 
    description: 'Minimum nights',
    minimum: 1,
    maximum: 365,
    example: 1
  })
  @IsInt({ message: 'Minimum stay nights must be an integer' })
  @Min(1, { message: 'Minimum stay must be at least 1 night' })
  @Max(365, { message: 'Minimum stay cannot exceed 365 nights' })
  min_stay_nights: number;

  @ApiProperty({ 
    required: true, 
    description: 'Maximum nights',
    minimum: 1,
    maximum: 365,
    example: 365
  })
  @IsInt({ message: 'Maximum stay nights must be an integer' })
  @Min(1, { message: 'Maximum stay must be at least 1 night' })
  @Max(365, { message: 'Maximum stay cannot exceed 365 nights' })
  max_stay_nights: number;

  @ApiProperty({ 
    required: true, 
    description: 'Advance notice in hours (0 = same day allowed)',
    minimum: 0,
    maximum: 168,
    example: 0
  })
  @IsInt({ message: 'Advance notice hours must be an integer' })
  @Min(0, { message: 'Advance notice cannot be negative' })
  @Max(168, { message: 'Advance notice cannot exceed 168 hours (1 week)' })
  advance_notice_hours: number;
}

// Apply custom validation to the entire DTO
export class ValidatedPricingRuleDto extends PricingRuleDto {
  constructor() {
    super();
  }
}