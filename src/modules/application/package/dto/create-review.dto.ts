import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty()
  booking_id?: string;

  @ApiProperty()
  rating_value?: number;

  @ApiProperty()
  comment?: string;
}
