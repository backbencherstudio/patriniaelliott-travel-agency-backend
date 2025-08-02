import { ApiProperty } from '@nestjs/swagger';

export class VendorPackageFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  file: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  file_alt: string;

  @ApiProperty()
  sort_order: number;

  @ApiProperty()
  is_featured: boolean;
}

export class VendorPackageRoomTypeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  bedrooms: number;

  @ApiProperty()
  bathrooms: number;

  @ApiProperty()
  max_guests: number;

  @ApiProperty()
  size_sqm: number;

  @ApiProperty()
  price: any;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  is_default: boolean;

  @ApiProperty()
  is_available: boolean;

  @ApiProperty()
  room_photos: any;
}

export class VendorPackageAvailabilityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  rates: any;

  @ApiProperty()
  restrictions: any;
}

export class VendorPackageReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    display_name: string;
    avatar: string;
  };
}

export class VendorPackageTripPlanDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  day: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  package_trip_plan_images: any[];
}

export class VendorPackageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: any;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  duration_type: string;

  @ApiProperty()
  min_capacity: number;

  @ApiProperty()
  max_capacity: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  unit_number: string;

  @ApiProperty()
  postal_code: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  bedrooms: number;

  @ApiProperty()
  bathrooms: number;

  @ApiProperty()
  max_guests: number;

  @ApiProperty()
  size_sqm: number;

  @ApiProperty()
  beds: any;

  @ApiProperty()
  amenities: any;

  @ApiProperty()
  breakfast_available: boolean;

  @ApiProperty()
  parking: any;

  @ApiProperty()
  house_rules: any;

  @ApiProperty()
  check_in: any;

  @ApiProperty()
  check_out: string;

  @ApiProperty()
  booking_method: string;

  @ApiProperty()
  commission_rate: any;

  @ApiProperty()
  host_earnings: any;

  @ApiProperty()
  rate_plans: any;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    display_name: string;
    avatar: string;
    type: string;
    phone_number: string;
    email: string;
  };

  @ApiProperty({ type: [VendorPackageFileDto] })
  package_files: VendorPackageFileDto[];

  @ApiProperty({ type: [VendorPackageRoomTypeDto] })
  package_room_types: VendorPackageRoomTypeDto[];

  @ApiProperty({ type: [VendorPackageAvailabilityDto] })
  package_availabilities: VendorPackageAvailabilityDto[];

  @ApiProperty({ type: [VendorPackageTripPlanDto] })
  package_trip_plans: VendorPackageTripPlanDto[];

  @ApiProperty({ type: [VendorPackageReviewDto] })
  reviews: VendorPackageReviewDto[];

  @ApiProperty()
  _count: {
    reviews: number;
  };
}

export class VendorPackageSearchResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    packages: VendorPackageDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export class VendorPackageDetailResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: VendorPackageDto;
}

export class VendorPackageListResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data: {
    packages: VendorPackageDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
} 