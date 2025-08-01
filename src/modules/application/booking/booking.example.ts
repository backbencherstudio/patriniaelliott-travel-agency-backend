/**
 * COMPREHENSIVE EXAMPLE: Dynamic ID Processing for Booking System
 * 
 * This example demonstrates how the system automatically processes:
 * - user_id (from JWT authentication)
 * - vendor_id (from package relationships)
 * - package_id (from request body)
 * 
 * All IDs are resolved dynamically based on the project schema.
 */

import { CreateBookingDto, BookingItemDto, BookingTravellerDto, BookingExtraServiceDto } from './dto/create-booking.dto';

/**
 * EXAMPLE 1: Basic Hotel Booking
 * 
 * Request Body Structure:
 */
export const basicHotelBookingExample: CreateBookingDto = {
  type: 'hotel',
  status: 'pending',
  booking_date_time: new Date(),
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone_number: '+1234567890',
  address1: '123 Main St',
  city: 'New York',
  state: 'NY',
  zip_code: '10001',
  country: 'USA',
  comments: 'Early check-in preferred',
  
  // Booking Items - Package IDs come from user selection
  booking_items: [
    {
      package_id: 'package_123', // Dynamic: User selects this package
      start_date: new Date('2024-02-15'),
      end_date: new Date('2024-02-18'),
      quantity: 1,
      packageRoomTypeId: 'room_type_456', // Optional: Specific room type
    }
  ],
  
  // Travellers - User provides this information
  booking_travellers: [
    {
      type: 'adult',
      gender: 'male',
      full_name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone_number: '+1234567890',
    },
    {
      type: 'child',
      gender: 'female',
      full_name: 'Jane Doe',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
    }
  ],
  
  // Optional: Extra Services
  booking_extra_services: [
    {
      extra_service_id: 'service_789',
      price: 50.00,
    }
  ]
};

/**
 * EXAMPLE 2: Tour Package Booking
 */
export const tourPackageBookingExample: CreateBookingDto = {
  type: 'tour',
  status: 'pending',
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice.smith@example.com',
  phone_number: '+1987654321',
  
  booking_items: [
    {
      package_id: 'tour_package_001', // Dynamic: User selects tour package
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-03-05'),
      quantity: 2,
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      full_name: 'Alice Smith',
      email: 'alice.smith@example.com',
    },
    {
      type: 'adult',
      full_name: 'Bob Smith',
      email: 'bob.smith@example.com',
    }
  ]
};

/**
 * EXAMPLE 3: Complex Multi-Package Booking
 */
export const complexMultiPackageBookingExample: CreateBookingDto = {
  type: 'mixed',
  first_name: 'Sarah',
  last_name: 'Johnson',
  email: 'sarah.johnson@example.com',
  
  // Multiple packages from same vendor
  booking_items: [
    {
      package_id: 'hotel_package_001', // Dynamic: Hotel package
      start_date: new Date('2024-04-10'),
      end_date: new Date('2024-04-15'),
      quantity: 1,
      packageRoomTypeId: 'deluxe_room_001',
    },
    {
      package_id: 'activity_package_001', // Dynamic: Activity package
      start_date: new Date('2024-04-12'),
      end_date: new Date('2024-04-12'),
      quantity: 2,
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
    },
    {
      type: 'adult',
      full_name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
    }
  ],
  
  booking_extra_services: [
    {
      extra_service_id: 'airport_transfer',
      price: 75.00,
    },
    {
      extra_service_id: 'guided_tour',
      price: 120.00,
    }
  ]
};

/**
 * HOW THE SYSTEM PROCESSES DYNAMIC IDs:
 * 
 * 1. USER_ID (from JWT Authentication):
 *    - Automatically extracted from req.user.userId
 *    - No need to pass in request body
 *    - Validated against User table
 * 
 * 2. VENDOR_ID (from Package Relationships):
 *    - Automatically determined from package.user_id
 *    - Package owner becomes the vendor
 *    - Validated against User table
 * 
 * 3. PACKAGE_ID (from Request Body):
 *    - User provides package_id in booking_items
 *    - System validates package exists and is approved
 *    - Package must have status = 1 and deleted_at = null
 * 
 * 4. AUTOMATIC PROCESSING FLOW:
 *    a. User sends booking request with package_id
 *    b. System extracts user_id from JWT token
 *    c. System queries package to get vendor_id (package.user_id)
 *    d. System validates all relationships exist
 *    e. System creates booking with all dynamic IDs
 * 
 * 5. SCHEMA RELATIONSHIPS:
 *    - User (id) -> Booking (user_id)
 *    - User (id) -> Package (user_id) -> Booking (vendor_id)
 *    - Package (id) -> BookingItem (package_id)
 * 
 * 6. VALIDATION CHECKS:
 *    - User exists and is authenticated
 *    - Package exists, is approved, and not deleted
 *    - Vendor exists and is valid
 *    - Room types are available (if specified)
 *    - Dates are valid and available
 *    - Extra services exist
 * 
 * 7. AUTOMATIC CALCULATIONS:
 *    - Total amount based on package prices and quantities
 *    - Invoice number generation
 *    - Booking date/time stamping
 * 
 * USAGE IN CONTROLLER:
 * 
 * @Post()
 * async create(@Req() req: Request, @Body() createBookingDto: CreateBookingDto) {
 *   const user_id = req.user.userId; // Dynamic from JWT
 *   return await this.bookingService.createBooking(user_id, createBookingDto);
 * }
 * 
 * The system handles all ID resolution automatically!
 */ 