import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateBookingTotalDto {
  @ApiProperty({ required: true, description: 'Package ID' })
  @IsNotEmpty()
  @IsString()
  package_id: string;

  @ApiProperty({ required: true, description: 'Booking start date' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({ required: true, description: 'Booking end date' })
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @ApiProperty({ required: false, description: 'Room type ID' })
  @IsOptional()
  @IsString()
  room_type_id?: string;

  @ApiProperty({ required: false, description: 'Number of rooms', default: 1 })
  @IsOptional()
  @IsNumber()
  quantity?: number = 1;

  @ApiProperty({ 
    required: false, 
    description: 'Extra services',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        extra_service_id: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'number', default: 1 }
      }
    }
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  extra_services?: Array<{
    extra_service_id: string;
    price?: number;
    quantity?: number;
  }>;
}
