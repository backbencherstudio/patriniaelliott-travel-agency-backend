import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty,IsOptional, IsJSON,IsNumber} from 'class-validator';
import { Transform } from 'class-transformer';

export interface TripPlan {
  title: string;
  description: string;
  images?: Express.Multer.File[];
}

export enum PackageStatus {
  Active = 0,
  Deactive = 1,
}

export class CreatePackageDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Package Name',
    example: 'Package Name',
  })
  name: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    description: 'Package total bedrooms',
    example: 1,
  })
  total_bedrooms?: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Package Description',
    example: 'Package Description',
  })
  description: string;

  @IsNotEmpty()
  // @IsNumber()
  @ApiProperty({
    description: 'Package price',
    example: 100,
  })
  price: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Package duration in days',
    example: 5,
  })
  duration: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Package duration type. e.g. days, hours, minutes',
    example: 'days',
  })
  duration_type?: string;

  

  @IsString()
  @ApiProperty({
    description: 'Package type. e.g. tour, cruise',
    example: 'tour',
    enum: ['tour', 'cruise'],
  })
  type?: string;

  @IsNotEmpty()
  // @IsNumber()
  @ApiProperty({ example: 1 })
  min_capacity?: number;

  @IsNotEmpty()
  // @IsNumber()
  @ApiProperty({ example: 10 })
  max_capacity: number;

  @IsString()
  @ApiProperty({
    description: 'Cancellation policy as JSON string',
    example: '{"refund_percentage": 80, "days_before": 7}',
    required: false,
  })
  cancellation_policy?: string;

  @ApiProperty({ 
    required: false,
    description: 'Bedrooms as JSON string or raw array/object (will be stringified)',
    examples: {
      asString: {
        summary: 'As JSON string (multipart/form-data friendly)',
        value: '[{"title":"Master Bedroom","beds":{"single_bed":1,"double_bed":1,"large_bed":0,"extra_large_bed":0}}]'
      },
      asArray: {
        summary: 'As raw array (application/json body)',
        value: [{"title":"Master Bedroom","beds":{"single_bed":1,"double_bed":1,"large_bed":0,"extra_large_bed":0}}]
      }
    }
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value == null || value === '') return undefined;
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value);
    } catch {
      return value;
    }
  })
  @IsJSON()
  bedrooms?: string;

  @ApiProperty({
    description: 'Destination array object with stringyfied ids',
    example: [
      {
        id: '1',
      },
      {
        id: '2',
      },
    ],
  })
  destinations: string;

  @IsNotEmpty()
  @ApiProperty()
  package_category: string;

  @ApiProperty()
  included_packages: string;

  @ApiProperty()
  excluded_packages: string;

  @ApiProperty()
  traveller_types?: string;

  // @IsNotEmpty()
  @ApiProperty()
  // trip_plans: {
  //   title: string;
  //   description: string;
  //   images?: Express.Multer.File[];
  // }[];
  trip_plans: string;

  @ApiProperty()
  status?: PackageStatus;

  @ApiProperty({
    description: 'Trip plans images object',
  })
  trip_plans_images?: any;

  @ApiProperty({
    description: 'Package images object',
  })
  // [{ id: '1' }, { id: '2' }]
  package_files?: any;

  @ApiProperty()
  extra_services?: any;


  @ApiProperty({
    description: 'Package array object with stringyfied ids',
    example: [
      {
        id: '1',
      },
      {
        id: '2',
      },
    ],
  })
  languages?: string;

  @ApiProperty({
    description: 'Package address',
    example: '123 Main Street, City, Country',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Package amenities as JSON string',
    example: '["WiFi", "Parking", "Pool"]',
    required: false,
  })
  @IsOptional()
  @IsString()
  amenities?: string;

  @ApiProperty({
    description: 'Number of bathrooms',
    example: 2,
    required: false,
  })
  @IsOptional()
  bathrooms?: number;

  @ApiProperty({
    description: 'Package city',
    example: 'Paris',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Package country',
    example: 'France',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    description: 'Package latitude',
    example: 48.8566,
    required: false,
  })
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Package longitude',
    example: 2.3522,
    required: false,
  })
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Package postal code',
    example: '75001',
    required: false,
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({
    description: 'Package unit number',
    example: 'Apt 101',
    required: false,
  })
  @IsOptional()
  @IsString()
  unit_number?: string;

  @ApiProperty({
    description: 'Package size in square meters',
    example: 120.5,
    required: false,
  })
  @IsOptional()
  size_sqm?: number;

  @ApiProperty({
    description: 'Maximum guests',
    example: 4,
    required: false,
  })
  @IsOptional()
  max_guests?: number;

  @ApiProperty({
    description: 'Package tour type',
    example: 'Adventure',
    required: false,
  })
  @IsOptional()
  @IsString()
  tour_type?: string;

  @ApiProperty({
    description: 'Meeting points as JSON string',
    example: '["Hotel Lobby", "Airport Terminal"]',
    required: false,
  })
  @IsOptional()
  @IsString()
  meting_points?: string;
}
