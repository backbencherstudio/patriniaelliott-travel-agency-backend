/**
 * PRACTICAL EXAMPLES: Extra Services & Facilities in Booking System
 * 
 * এই file এ real-world scenarios এর জন্য extra services এর examples আছে
 */

import { CreateBookingDto, BookingExtraServiceDto } from './dto/create-booking.dto';

/**
 * EXAMPLE 1: Luxury Hotel Booking with Premium Services
 * 
 * Scenario: Customer booking 5-star hotel with multiple premium services
 */
export const luxuryHotelBookingExample: CreateBookingDto = {
  type: 'hotel',
  status: 'pending',
  booking_date_time: new Date(),
  first_name: 'Ahmed',
  last_name: 'Hassan',
  email: 'ahmed.hassan@example.com',
  phone_number: '+8801712345678',
  address1: 'House 123, Road 45',
  city: 'Dhaka',
  state: 'Dhaka',
  zip_code: '1200',
  country: 'Bangladesh',
  comments: 'Anniversary celebration - please arrange special decoration',
  
  booking_items: [
    {
      package_id: 'luxury_hotel_001', // 5-star hotel package
      start_date: new Date('2024-03-15'),
      end_date: new Date('2024-03-18'),
      quantity: 1,
      packageRoomTypeId: 'presidential_suite_001',
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      gender: 'male',
      full_name: 'Ahmed Hassan',
      first_name: 'Ahmed',
      last_name: 'Hassan',
      email: 'ahmed.hassan@example.com',
      phone_number: '+8801712345678',
    },
    {
      type: 'adult',
      gender: 'female',
      full_name: 'Fatima Hassan',
      first_name: 'Fatima',
      last_name: 'Hassan',
      email: 'fatima.hassan@example.com',
    }
  ],
  
  // Premium extra services for luxury experience
  booking_extra_services: [
    {
      extra_service_id: 'airport_limo_transfer',
      price: 150.00,
      quantity: 2, // Round trip
      notes: 'Luxury limousine transfer from airport'
    },
    {
      extra_service_id: 'butler_service',
      price: 200.00,
      quantity: 3, // 3 days
      notes: 'Personal butler service for entire stay'
    },
    {
      extra_service_id: 'couple_spa_package',
      price: 300.00,
      quantity: 1,
      notes: 'Full day couple spa package with massage and treatments'
    },
    {
      extra_service_id: 'private_dining',
      price: 180.00,
      quantity: 2, // 2 nights
      notes: 'Private dining setup in room with chef service'
    },
    {
      extra_service_id: 'helicopter_tour',
      price: 500.00,
      quantity: 1,
      notes: 'City helicopter tour for 2 people'
    }
  ]
};

/**
 * EXAMPLE 2: Family Tour Package with Child-Friendly Services
 * 
 * Scenario: Family of 4 (2 adults, 2 children) booking tour with family services
 */
export const familyTourBookingExample: CreateBookingDto = {
  type: 'tour',
  status: 'pending',
  booking_date_time: new Date(),
  first_name: 'Karim',
  last_name: 'Rahman',
  email: 'karim.rahman@example.com',
  phone_number: '+8801912345678',
  address1: 'Villa 456, Gulshan',
  city: 'Dhaka',
  state: 'Dhaka',
  zip_code: '1212',
  country: 'Bangladesh',
  comments: 'Family with 2 children (ages 8 and 12) - need child-friendly activities',
  
  booking_items: [
    {
      package_id: 'family_tour_001',
      start_date: new Date('2024-04-20'),
      end_date: new Date('2024-04-25'),
      quantity: 4, // 4 people
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      gender: 'male',
      full_name: 'Karim Rahman',
      first_name: 'Karim',
      last_name: 'Rahman',
      email: 'karim.rahman@example.com',
      phone_number: '+8801912345678',
    },
    {
      type: 'adult',
      gender: 'female',
      full_name: 'Nazma Rahman',
      first_name: 'Nazma',
      last_name: 'Rahman',
      email: 'nazma.rahman@example.com',
    },
    {
      type: 'child',
      gender: 'male',
      full_name: 'Arif Rahman',
      first_name: 'Arif',
      last_name: 'Rahman',
      email: 'arif.rahman@example.com',
    },
    {
      type: 'child',
      gender: 'female',
      full_name: 'Sara Rahman',
      first_name: 'Sara',
      last_name: 'Rahman',
      email: 'sara.rahman@example.com',
    }
  ],
  
  // Family-friendly extra services
  booking_extra_services: [
    {
      extra_service_id: 'family_transport',
      price: 80.00,
      quantity: 5, // 5 days
      notes: 'Family van with child seats for comfortable travel'
    },
    {
      extra_service_id: 'child_minder',
      price: 60.00,
      quantity: 3, // 3 days when parents want alone time
      notes: 'Professional child minder for kids during adult activities'
    },
    {
      extra_service_id: 'family_photography',
      price: 200.00,
      quantity: 1,
      notes: 'Professional family photography session'
    },
    {
      extra_service_id: 'kids_activity_package',
      price: 120.00,
      quantity: 2, // For 2 children
      notes: 'Special kids activity package with games and entertainment'
    },
    {
      extra_service_id: 'family_meal_upgrade',
      price: 40.00,
      quantity: 5, // 5 days
      notes: 'Upgraded family meals with kid-friendly options'
    }
  ]
};

/**
 * EXAMPLE 3: Business Travel with Corporate Services
 * 
 * Scenario: Business executive booking hotel with corporate services
 */
export const businessTravelBookingExample: CreateBookingDto = {
  type: 'hotel',
  status: 'pending',
  booking_date_time: new Date(),
  first_name: 'Rashid',
  last_name: 'Ahmed',
  email: 'rashid.ahmed@company.com',
  phone_number: '+8801812345678',
  address1: 'Office 789, Dhanmondi',
  city: 'Dhaka',
  state: 'Dhaka',
  zip_code: '1205',
  country: 'Bangladesh',
  comments: 'Business trip - need meeting facilities and high-speed internet',
  
  booking_items: [
    {
      package_id: 'business_hotel_001',
      start_date: new Date('2024-05-10'),
      end_date: new Date('2024-05-12'),
      quantity: 1,
      packageRoomTypeId: 'executive_suite_001',
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      gender: 'male',
      full_name: 'Rashid Ahmed',
      first_name: 'Rashid',
      last_name: 'Ahmed',
      email: 'rashid.ahmed@company.com',
      phone_number: '+8801812345678',
    }
  ],
  
  // Business-focused extra services
  booking_extra_services: [
    {
      extra_service_id: 'airport_business_transfer',
      price: 100.00,
      quantity: 2, // Round trip
      notes: 'Business class airport transfer with WiFi'
    },
    {
      extra_service_id: 'meeting_room_rental',
      price: 150.00,
      quantity: 2, // 2 days
      notes: 'Private meeting room with presentation facilities'
    },
    {
      extra_service_id: 'business_center_access',
      price: 50.00,
      quantity: 2, // 2 days
      notes: '24/7 business center access with printing and secretarial services'
    },
    {
      extra_service_id: 'high_speed_internet',
      price: 30.00,
      quantity: 2, // 2 days
      notes: 'Premium high-speed internet for video conferences'
    },
    {
      extra_service_id: 'late_checkout',
      price: 75.00,
      quantity: 1,
      notes: 'Late checkout until 6 PM for business meetings'
    }
  ]
};

/**
 * EXAMPLE 4: Adventure Tour with Equipment and Safety Services
 * 
 * Scenario: Adventure enthusiasts booking hiking tour with safety equipment
 */
export const adventureTourBookingExample: CreateBookingDto = {
  type: 'tour',
  status: 'pending',
  booking_date_time: new Date(),
  first_name: 'Tariq',
  last_name: 'Islam',
  email: 'tariq.islam@example.com',
  phone_number: '+8801612345678',
  address1: 'Apartment 321, Banani',
  city: 'Dhaka',
  state: 'Dhaka',
  zip_code: '1213',
  country: 'Bangladesh',
  comments: 'Adventure tour - need all safety equipment and experienced guide',
  
  booking_items: [
    {
      package_id: 'adventure_tour_001',
      start_date: new Date('2024-06-15'),
      end_date: new Date('2024-06-20'),
      quantity: 2, // 2 people
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      gender: 'male',
      full_name: 'Tariq Islam',
      first_name: 'Tariq',
      last_name: 'Islam',
      email: 'tariq.islam@example.com',
      phone_number: '+8801612345678',
    },
    {
      type: 'adult',
      gender: 'male',
      full_name: 'Sakib Hasan',
      first_name: 'Sakib',
      last_name: 'Hasan',
      email: 'sakib.hasan@example.com',
    }
  ],
  
  // Adventure and safety extra services
  booking_extra_services: [
    {
      extra_service_id: 'professional_guide',
      price: 200.00,
      quantity: 5, // 5 days
      notes: 'Experienced mountain guide with first aid certification'
    },
    {
      extra_service_id: 'hiking_equipment',
      price: 80.00,
      quantity: 2, // For 2 people
      notes: 'Complete hiking gear including boots, backpack, and safety equipment'
    },
    {
      extra_service_id: 'emergency_satellite_phone',
      price: 50.00,
      quantity: 1,
      notes: 'Satellite phone for emergency communication in remote areas'
    },
    {
      extra_service_id: 'adventure_insurance',
      price: 100.00,
      quantity: 2, // For 2 people
      notes: 'Comprehensive adventure travel insurance'
    },
    {
      extra_service_id: 'camping_equipment',
      price: 120.00,
      quantity: 1,
      notes: 'Complete camping setup including tent, sleeping bags, and cooking gear'
    },
    {
      extra_service_id: 'action_camera_rental',
      price: 40.00,
      quantity: 2, // 2 cameras
      notes: 'GoPro cameras to capture adventure moments'
    }
  ]
};

/**
 * EXAMPLE 5: Budget Travel with Essential Services Only
 * 
 * Scenario: Budget-conscious traveler booking basic package with minimal extras
 */
export const budgetTravelBookingExample: CreateBookingDto = {
  type: 'hotel',
  status: 'pending',
  booking_date_time: new Date(),
  first_name: 'Mina',
  last_name: 'Begum',
  email: 'mina.begum@example.com',
  phone_number: '+8801512345678',
  address1: 'House 654, Mirpur',
  city: 'Dhaka',
  state: 'Dhaka',
  zip_code: '1216',
  country: 'Bangladesh',
  comments: 'Budget travel - only essential services needed',
  
  booking_items: [
    {
      package_id: 'budget_hotel_001',
      start_date: new Date('2024-07-05'),
      end_date: new Date('2024-07-08'),
      quantity: 1,
    }
  ],
  
  booking_travellers: [
    {
      type: 'adult',
      gender: 'female',
      full_name: 'Mina Begum',
      first_name: 'Mina',
      last_name: 'Begum',
      email: 'mina.begum@example.com',
      phone_number: '+8801512345678',
    }
  ],
  
  // Only essential extra services
  booking_extra_services: [
    {
      extra_service_id: 'basic_transport',
      price: 25.00,
      quantity: 2, // Round trip
      notes: 'Basic airport transfer service'
    },
    {
      extra_service_id: 'wifi_access',
      price: 15.00,
      quantity: 3, // 3 days
      notes: 'Basic WiFi access for communication'
    }
  ]
};

/**
 * PRICE CALCULATION EXAMPLES
 */

// Luxury Hotel Booking Total Calculation
export const luxuryHotelTotalCalculation = () => {
  const packagePrice = 500.00; // Hotel package price
  const packageTotal = packagePrice * 1; // 1 room
  
  const extraServicesTotal = 
    (150.00 * 2) + // Airport limo transfer (round trip)
    (200.00 * 3) + // Butler service (3 days)
    (300.00 * 1) + // Couple spa package
    (180.00 * 2) + // Private dining (2 nights)
    (500.00 * 1);  // Helicopter tour
  
  const total = packageTotal + extraServicesTotal;
  
  return {
    packageTotal,
    extraServicesTotal,
    total,
    breakdown: {
      'Hotel Package': packageTotal,
      'Airport Transfer': 300.00,
      'Butler Service': 600.00,
      'Spa Package': 300.00,
      'Private Dining': 360.00,
      'Helicopter Tour': 500.00,
      'Total': total
    }
  };
};

// Family Tour Total Calculation
export const familyTourTotalCalculation = () => {
  const packagePrice = 200.00; // Per person
  const packageTotal = packagePrice * 4; // 4 people
  
  const extraServicesTotal = 
    (80.00 * 5) +  // Family transport (5 days)
    (60.00 * 3) +  // Child minder (3 days)
    (200.00 * 1) + // Family photography
    (120.00 * 2) + // Kids activity (2 children)
    (40.00 * 5);   // Meal upgrade (5 days)
  
  const total = packageTotal + extraServicesTotal;
  
  return {
    packageTotal,
    extraServicesTotal,
    total,
    breakdown: {
      'Tour Package (4 people)': packageTotal,
      'Family Transport': 400.00,
      'Child Minder': 180.00,
      'Photography': 200.00,
      'Kids Activities': 240.00,
      'Meal Upgrade': 200.00,
      'Total': total
    }
  };
};

/**
 * COMMON EXTRA SERVICES DATABASE SEED DATA
 */
export const commonExtraServices = [
  // Transportation Services
  { id: 'airport_transfer', name: 'Airport Transfer', description: 'Pickup from airport to hotel', price: 50.00 },
  { id: 'airport_limo_transfer', name: 'Luxury Airport Transfer', description: 'Luxury limousine airport transfer', price: 150.00 },
  { id: 'airport_business_transfer', name: 'Business Airport Transfer', description: 'Business class transfer with WiFi', price: 100.00 },
  { id: 'basic_transport', name: 'Basic Transport', description: 'Basic transportation service', price: 25.00 },
  { id: 'family_transport', name: 'Family Transport', description: 'Family van with child seats', price: 80.00 },
  
  // Hotel Services
  { id: 'butler_service', name: 'Butler Service', description: 'Personal butler service', price: 200.00 },
  { id: 'room_service', name: 'Room Service', description: '24/7 room service', price: 25.00 },
  { id: 'late_checkout', name: 'Late Checkout', description: 'Extended checkout time', price: 75.00 },
  { id: 'wifi_access', name: 'WiFi Access', description: 'High-speed internet access', price: 15.00 },
  { id: 'high_speed_internet', name: 'Premium Internet', description: 'Premium high-speed internet', price: 30.00 },
  
  // Spa & Wellness
  { id: 'spa_massage', name: 'Spa Massage', description: 'Relaxing full body massage', price: 80.00 },
  { id: 'couple_spa_package', name: 'Couple Spa Package', description: 'Full day couple spa experience', price: 300.00 },
  
  // Business Services
  { id: 'meeting_room_rental', name: 'Meeting Room', description: 'Private meeting room rental', price: 150.00 },
  { id: 'business_center_access', name: 'Business Center', description: '24/7 business center access', price: 50.00 },
  
  // Adventure & Tour Services
  { id: 'professional_guide', name: 'Professional Guide', description: 'Experienced tour guide', price: 200.00 },
  { id: 'tour_guide', name: 'Tour Guide', description: 'Professional tour guide service', price: 100.00 },
  { id: 'hiking_equipment', name: 'Hiking Equipment', description: 'Complete hiking gear rental', price: 80.00 },
  { id: 'camping_equipment', name: 'Camping Equipment', description: 'Complete camping setup', price: 120.00 },
  { id: 'adventure_insurance', name: 'Adventure Insurance', description: 'Comprehensive adventure insurance', price: 100.00 },
  { id: 'emergency_satellite_phone', name: 'Satellite Phone', description: 'Emergency satellite communication', price: 50.00 },
  
  // Photography & Entertainment
  { id: 'photography', name: 'Photography Service', description: 'Professional photography session', price: 150.00 },
  { id: 'family_photography', name: 'Family Photography', description: 'Professional family photo session', price: 200.00 },
  { id: 'action_camera_rental', name: 'Action Camera', description: 'GoPro camera rental', price: 40.00 },
  { id: 'helicopter_tour', name: 'Helicopter Tour', description: 'City helicopter tour', price: 500.00 },
  
  // Family Services
  { id: 'child_minder', name: 'Child Minder', description: 'Professional child care service', price: 60.00 },
  { id: 'kids_activity_package', name: 'Kids Activities', description: 'Special kids activity package', price: 120.00 },
  { id: 'family_meal_upgrade', name: 'Family Meal Upgrade', description: 'Upgraded family meals', price: 40.00 },
  
  // Dining Services
  { id: 'private_dining', name: 'Private Dining', description: 'Private dining setup with chef', price: 180.00 },
];

export default {
  luxuryHotelBookingExample,
  familyTourBookingExample,
  businessTravelBookingExample,
  adventureTourBookingExample,
  budgetTravelBookingExample,
  luxuryHotelTotalCalculation,
  familyTourTotalCalculation,
  commonExtraServices
};
