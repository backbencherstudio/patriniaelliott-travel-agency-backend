import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDate, IsNumber, IsOptional, Min, Max, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestInfoDto {
  @ApiProperty({ required: true, minimum: 1 })
  @IsNumber()
  @Min(1)
  adults: number;

  @ApiProperty({ required: false, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  children?: number = 0;

  @ApiProperty({ required: false, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  infants?: number = 0;
}

export class InitiateCheckoutDto {
  @ApiProperty({ required: true, description: 'Package ID to book' })
  @IsNotEmpty()
  @IsString()
  package_id: string;

  @ApiProperty({ required: true, description: 'Room type ID from the package' })
  @IsNotEmpty()
  @IsString()
  room_type_id: string;

  @ApiProperty({ required: true, description: 'Check-in date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({ required: true, description: 'Check-out date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @ApiProperty({ required: true, minimum: 1, maximum: 10, description: 'Number of rooms to book' })
  @IsNumber()
  @Min(1)
  @Max(10)
  quantity: number = 1;

  @ApiProperty({ required: true, type: GuestInfoDto })
  @IsObject()
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guests: GuestInfoDto;
} 