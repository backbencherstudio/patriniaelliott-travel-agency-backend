import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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
  @ApiProperty()
  cancellation_policy_id?: string;

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
    description: 'Bedrooms data as JSON array',
    example: [
      {
        title: "Master Bedroom",
        beds: {
          single_bed: 1,
          double_bed: 1,
          large_bed: 0,
          extra_large_bed: 0
        }
      }
    ],
  })
  @IsString()
  bedrooms?: string;

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
}
