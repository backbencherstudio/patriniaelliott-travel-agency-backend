import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDate, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class EnhancedSearchDto {
  // Basic search
  @ApiProperty({ required: false, description: 'Search term for package name, description, or location' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Search by package name specifically' })
  @IsOptional()
  @IsString()
  name?: string;

  // Location/Destination search
  @ApiProperty({ required: false, description: 'Location or destination name' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, description: 'City name for filtering' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Country name for filtering' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, description: 'Destination ID' })
  @IsOptional()
  @IsString()
  destination_id?: string;

  @ApiProperty({ required: false, description: 'Popular destination filter' })
  @IsOptional()
  @IsString()
  popular_destination?: string;

  // Duration filters
  @ApiProperty({ required: false, description: 'Minimum duration (in days)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration_start?: number;

  @ApiProperty({ required: false, description: 'Maximum duration (in days)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration_end?: number;

  // Budget filters
  @ApiProperty({ required: false, description: 'Minimum price per night' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  budget_start?: number;

  @ApiProperty({ required: false, description: 'Maximum price per night' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  budget_end?: number;

  // Rating filters
  @ApiProperty({ required: false, description: 'Exact rating (1-5) or comma-separated ratings (e.g., "4,5"). Single value shows only that rating, multiple values show any of those ratings.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    // Handle both single number and comma-separated values
    if (typeof value === 'string') {
      return value;
    }
    return String(value);
  })
  min_rating?: string;

  @ApiProperty({ required: false, description: 'Rating filter (comma-separated values)' })
  @IsOptional()
  @IsString()
  ratings?: string;

  // Cancellation policy
  @ApiProperty({ required: false, description: 'Free cancellation filter' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return value;
  })
  free_cancellation?: boolean;

  // Property type
  @ApiProperty({ required: false, description: 'Type of residence (villa, hotel, apartment, etc.)' })
  @IsOptional()
  @IsString()
  type_of_residence?: string;

  @ApiProperty({ required: false, description: 'Package type (tour, accommodation, etc.)' })
  @IsOptional()
  @IsString()
  type?: string;

  // Meal plans
  @ApiProperty({ required: false, description: 'Meal plans available' })
  @IsOptional()
  @IsString()
  meal_plans?: string;

  // Popular area
  @ApiProperty({ required: false, description: 'Popular area filter' })
  @IsOptional()
  @IsString()
  popular_area?: string;

  // Guest filters
  @ApiProperty({ required: false, minimum: 1, description: 'Number of adults' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  adults?: number = 1;

  @ApiProperty({ required: false, minimum: 0, description: 'Number of children' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  children?: number = 0;

  @ApiProperty({ required: false, minimum: 0, description: 'Number of infants' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  infants?: number = 0;

  @ApiProperty({ required: false, minimum: 1, maximum: 10, description: 'Number of rooms' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  rooms?: number = 1;

  // Date filters
  @ApiProperty({ required: false, description: 'Check-in date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_date?: Date;

  @ApiProperty({ required: false, description: 'Check-out date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  // Category and other filters
  @ApiProperty({ required: false, description: 'Category ID' })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ required: false, description: 'Languages filter (comma-separated)' })
  @IsOptional()
  @IsString()
  languages?: string;

  @ApiProperty({ required: false, description: 'Traveller type IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  traveller_types?: string;

  @ApiProperty({ required: false, description: 'Tag IDs (comma-separated)' })
  @IsOptional()
  @IsString()
  tags?: string;

  // Pagination and sorting
  @ApiProperty({ required: false, minimum: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, minimum: 1, maximum: 50, default: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ 
    required: false, 
    enum: ['price_asc', 'price_desc', 'rating_desc', 'created_at_desc', 'name_asc', 'name_desc'], 
    default: 'created_at_desc',
    description: 'Sort order'
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const validSortOptions = ['price_asc', 'price_desc', 'rating_desc', 'created_at_desc', 'name_asc', 'name_desc'];
    return validSortOptions.includes(value) ? value : 'created_at_desc';
  })
  sort_by?: string = 'created_at_desc';

  // Vendor specific filters
  @ApiProperty({ required: false, description: 'Vendor ID' })
  @IsOptional()
  @IsString()
  vendor_id?: string;

  @ApiProperty({ required: false, description: 'Vendor name' })
  @IsOptional()
  @IsString()
  vendor_name?: string;
}
