import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDate, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BookingTravellerDto {
  @ApiProperty({ description: 'Traveller type (adult, child, infant)' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Traveller gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ description: 'Traveller full name' })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({ description: 'Traveller first name' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ description: 'Traveller last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ description: 'Traveller email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Traveller phone number' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ description: 'Traveller address line 1' })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiProperty({ description: 'Traveller address line 2' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ description: 'Traveller city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Traveller state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Traveller zip code' })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ description: 'Traveller country' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class BookingItemDto {
  @ApiProperty({ description: 'Package ID for the booking item' })
  @IsNotEmpty()
  @IsString()
  package_id: string;

  @ApiProperty({ description: 'Start date for the booking' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty({ description: 'End date for the booking' })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @ApiProperty({ description: 'Quantity of items', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number = 1;

  @ApiProperty({ description: 'Price per item' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiProperty({ description: 'Package room type ID' })
  @IsOptional()
  @IsString()
  packageRoomTypeId?: string;
}

export class BookingExtraServiceDto {
  @ApiProperty({ description: 'Extra service ID' })
  @IsNotEmpty()
  @IsString()
  extra_service_id: string;

  @ApiProperty({ description: 'Price for the extra service' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;
}

export class CreateBookingDto {
  @ApiProperty({ description: 'Booking type (tour, hotel, etc.)', default: 'tour' })
  @IsOptional()
  @IsString()
  type?: string = 'tour';

  @ApiProperty({ description: 'Booking status', default: 'pending' })
  @IsOptional()
  @IsString()
  status?: string = 'pending';

  @ApiProperty({ description: 'Booking date and time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  booking_date_time?: Date;

  @ApiProperty({ description: 'Total amount for the booking' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total_amount?: number;

  @ApiProperty({ description: 'Payment status' })
  @IsOptional()
  @IsString()
  payment_status?: string;

  @ApiProperty({ description: 'Customer first name' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ description: 'Customer address line 1' })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiProperty({ description: 'Customer address line 2' })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ description: 'Customer city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Customer state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Customer zip code' })
  @IsOptional()
  @IsString()
  zip_code?: string;

  @ApiProperty({ description: 'Customer country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Additional comments' })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ description: 'Booking items', type: [BookingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingItemDto)
  booking_items: BookingItemDto[];

  @ApiProperty({ description: 'Booking travellers', type: [BookingTravellerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingTravellerDto)
  booking_travellers: BookingTravellerDto[];

  @ApiProperty({ description: 'Extra services', type: [BookingExtraServiceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingExtraServiceDto)
  booking_extra_services?: BookingExtraServiceDto[];
}
