import { ApiProperty } from '@nestjs/swagger';

export class PackageResponseDto {
  @ApiProperty({
    description: 'Package ID',
    example: 'clx123abc456',
  })
  id: string;

  @ApiProperty({
    description: 'Package name',
    example: 'Beach Vacation Package',
  })
  name: string;

  @ApiProperty({
    description: 'Package description',
    example: 'Enjoy a wonderful beach vacation with all amenities included.',
  })
  description: string;

  @ApiProperty({
    description: 'Package price',
    example: 999.99,
  })
  price: number;

  @ApiProperty({
    description: 'Package duration',
    example: 5,
  })
  duration: number;

  @ApiProperty({
    description: 'Duration type',
    example: 'days',
  })
  duration_type: string;

  @ApiProperty({
    description: 'Package type',
    example: 'tour',
  })
  type: string;

  @ApiProperty({
    description: 'Minimum capacity',
    example: 1,
  })
  min_capacity: number;

  @ApiProperty({
    description: 'Maximum capacity',
    example: 10,
  })
  max_capacity: number;

  @ApiProperty({
    description: 'Average rating',
    example: 4.5,
  })
  average_rating: number;

  @ApiProperty({
    description: 'Number of reviews',
    example: 25,
  })
  reviews_count: number;

  @ApiProperty({
    description: 'Package status',
    example: 1,
  })
  status: number;

  @ApiProperty({
    description: 'Approval date',
    example: '2025-01-15T10:30:00Z',
  })
  approved_at: Date;

  @ApiProperty({
    description: 'Created date',
    example: '2025-01-10T08:00:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Updated date',
    example: '2025-01-15T10:30:00Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Location information',
    example: {
      country: 'USA',
      city: 'Miami',
      address: '123 Beach Road',
      latitude: 25.7617,
      longitude: -80.1918,
    },
  })
  country?: string;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;

  @ApiProperty({
    description: 'Property details',
    example: {
      bedrooms: 2,
      bathrooms: 2,
      max_guests: 6,
      size_sqm: 120,
    },
  })
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  size_sqm?: number;

  @ApiProperty({
    description: 'Host information',
    example: {
      is_property: true,
      is_host: true,
      host_name: 'John Doe',
      about_host: 'Experienced host with 5 years of hosting experience.',
    },
  })
  is_property?: boolean;
  is_host?: boolean;
  host_name?: string;
  about_host?: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'user123',
      name: 'John Doe',
      avatar: 'avatar.jpg',
      type: 'vendor',
    },
  })
  user?: {
    id: string;
    name: string;
    avatar?: string;
    avatar_url?: string;
    type: string;
  };

  @ApiProperty({
    description: 'Package files/images',
    example: [
      {
        id: 'file123',
        file: 'package-image.jpg',
        file_url: 'https://example.com/packages/package-image.jpg',
        file_alt: 'Beach view',
        type: 'image',
        is_featured: true,
        sort_order: 1,
      },
    ],
  })
  package_files?: Array<{
    id: string;
    file: string;
    file_url?: string;
    file_alt?: string;
    type?: string;
    is_featured?: boolean;
    sort_order?: number;
  }>;

  @ApiProperty({
    description: 'Package destinations',
    example: [
      {
        destination: {
          id: 'dest123',
          name: 'Miami Beach',
          country: {
            id: 'country123',
            name: 'USA',
          },
        },
      },
    ],
  })
  package_destinations?: Array<{
    destination: {
      id: string;
      name: string;
      country: {
        id: string;
        name: string;
      };
    };
  }>;

  @ApiProperty({
    description: 'Package languages',
    example: [
      {
        language: {
          id: 'lang123',
          name: 'English',
        },
      },
    ],
  })
  package_languages?: Array<{
    language: {
      id: string;
      name: string;
    };
  }>;

  @ApiProperty({
    description: 'Package categories',
    example: [
      {
        category: {
          id: 'cat123',
          name: 'Beach',
        },
      },
    ],
  })
  package_categories?: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;

  @ApiProperty({
    description: 'Cancellation policy',
    example: {
      id: 'policy123',
      policy: 'free_cancellation',
      description: 'Free cancellation up to 24 hours before check-in.',
    },
  })
  cancellation_policy?: {
    id: string;
    policy: string;
    description?: string;
  };

  @ApiProperty({
    description: 'Package reviews',
    example: [
      {
        id: 'review123',
        rating_value: 5,
        comment: 'Excellent experience!',
        user_id: 'user123',
        created_at: '2025-01-15T10:30:00Z',
      },
    ],
  })
  reviews?: Array<{
    id: string;
    rating_value: number;
    comment?: string;
    user_id: string;
    created_at: Date;
  }>;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  current_page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  total_pages: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 50,
  })
  total_items: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  items_per_page: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  has_next_page: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  has_previous_page: boolean;
}

export class PackagesResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
    type: 'object',
    properties: {
      packages: {
        type: 'array',
        items: { $ref: '#/components/schemas/PackageResponseDto' },
      },
      pagination: { $ref: '#/components/schemas/PaginationDto' },
    },
  })
  data: {
    packages: PackageResponseDto[];
    pagination: PaginationDto;
  };
} 