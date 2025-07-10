import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserProfileDto } from './create-user-profile.dto';

export class UpdateUserProfileDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  first_name: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  last_name: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  display_name: string;

  @ApiProperty({
    description: 'The nationality of the user',
    example: 'United States',
  })
  nationality: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
  })
  phone_number: string;

  @ApiProperty({
    description: 'The gender of the user',
    example: 'male',
  })
  gender: string;

  @ApiProperty({
    description: 'The date of birth of the user',
    example: '1990-01-01',
  })
  date_of_birth: Date;

  @ApiProperty({
    description: 'The country of the user',
    example: 'United States',
  })
  country: string;

  @ApiProperty({
    description: 'The street address of the user',
    example: '123 Main St',
  })
  street_address: string;

  @ApiProperty({
    description: 'The apt/suite/unit of the user',
    example: '123',
  })
  apt_suite_unit: string;

  @ApiProperty({
    description: 'The city of the user',
    example: 'New York',
  })
  city: string;

  @ApiProperty({
    description: 'The state of the user',
    example: 'New York',
  })
  state: string;

  @ApiProperty({
    description: 'The zip code of the user',
    example: '10001',
  })
  zip_code: string;

  @ApiProperty({
    description: 'The passport first name of the user',
    example: 'John',
  })
  passport_first_name: string;

  @ApiProperty({
    description: 'The passport last name of the user',
    example: 'Doe',
  })
  passport_last_name: string;

  @ApiProperty({
    description: 'The passport number of the user',
    example: '1234567890',
  })
  passport_number: string;

  @ApiProperty({
    description: 'The passport issuing country of the user',
    example: 'United States',
  })
  passport_issuing_country: string;

  @ApiProperty({
    description: 'The passport expiry date of the user',
    example: '2025-01-01',
  })
  passport_expiry_date: string;


}
