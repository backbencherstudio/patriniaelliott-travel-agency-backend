import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class BulkCompleteBookingDto {
  @ApiProperty({
    description: 'Array of booking IDs to complete',
    example: ['booking_id_1', 'booking_id_2', 'booking_id_3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one booking ID is required' })
  @IsString({ each: true, message: 'Each booking ID must be a string' })
  booking_ids: string[];
}
