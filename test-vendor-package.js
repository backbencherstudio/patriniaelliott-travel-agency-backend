// Test script for Vendor Package API
// This demonstrates how to create a vendor package with nested room types and availabilities

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

// Example request data (similar to the image you showed)
const vendorPackageData = {
  name: "Beach Paradise Resort",
  type: "hotel",
  description: "Luxury beachfront resort with private beach access",
  price: 150.00,
  address: "12 Marine Drive, Cox's Bazar",
  bedrooms: 2,
  bathrooms: 2,
  max_guests: 4,
  country: "Bangladesh",
  city: "Cox's Bazar",
  package_room_types: [
    {
      name: "Deluxe Ocean View",
      description: "Spacious room with stunning ocean views",
      bedrooms: 1,
      bathrooms: 1,
      max_guests: 2,
      size_sqm: 45.0,
      beds: {
        bedroom_1: {
          type: "king",
          count: 1
        }
      },
      price: 200.00,
      currency: "USD",
      is_default: true,
      is_available: true,
      room_photos: {
        main: "ocean-view-main.jpg",
        gallery: ["ocean-view-1.jpg", "ocean-view-2.jpg", "ocean-view-3.jpg"]
      }
    }
  ],
  package_availabilities: [
    {
      date: "2023-12-01",
      status: "available",
      rates: {
        base_price: 200.00,
        weekend_price: 250.00,
        holiday_price: 300.00
      },
      restrictions: {
        min_stay: 1,
        max_stay: 30,
        advance_booking: 365
      }
    },
    {
      date: "2023-12-02",
      status: "available",
      rates: {
        base_price: 200.00,
        weekend_price: 250.00,
        holiday_price: 300.00
      },
      restrictions: {
        min_stay: 1,
        max_stay: 30,
        advance_booking: 365
      }
    }
  ],
  amenities: {
    wifi: true,
    air_conditioning: true,
    private_beach: true,
    swimming_pool: true,
    spa: true,
    restaurant: true,
    room_service: true,
    parking: true
  },
  house_rules: {
    check_in: "15:00",
    check_out: "11:00",
    no_smoking: true,
    no_pets: true,
    quiet_hours: "22:00-08:00"
  },
  booking_method: "instant",
  commission_rate: 15.0
};

// Function to create vendor package
async function createVendorPackage() {
  try {
    console.log('Creating vendor package...');
    
    // Create FormData for file upload
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Add the JSON data
    formData.append('name', vendorPackageData.name);
    formData.append('type', vendorPackageData.type);
    formData.append('description', vendorPackageData.description);
    formData.append('price', vendorPackageData.price);
    formData.append('address', vendorPackageData.address);
    formData.append('bedrooms', vendorPackageData.bedrooms);
    formData.append('bathrooms', vendorPackageData.bathrooms);
    formData.append('max_guests', vendorPackageData.max_guests);
    formData.append('country', vendorPackageData.country);
    formData.append('city', vendorPackageData.city);
    
    // Add nested data as JSON strings
    formData.append('package_room_types', JSON.stringify(vendorPackageData.package_room_types));
    formData.append('package_availabilities', JSON.stringify(vendorPackageData.package_availabilities));
    formData.append('amenities', JSON.stringify(vendorPackageData.amenities));
    formData.append('house_rules', JSON.stringify(vendorPackageData.house_rules));
    formData.append('booking_method', vendorPackageData.booking_method);
    formData.append('commission_rate', vendorPackageData.commission_rate);
    
    // Add files (if any)
    // formData.append('package_files', fs.createReadStream('./sample-image.jpg'));
    // formData.append('trip_plans_images', fs.createReadStream('./trip-plan.jpg'));
    
    const response = await axios.post(
      `${API_BASE_URL}/application/vendor-package`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('✅ Vendor package created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error creating vendor package:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get vendor packages
async function getVendorPackages() {
  try {
    console.log('Fetching vendor packages...');
    
    const response = await axios.get(
      `${API_BASE_URL}/application/vendor-package`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        params: {
          page: 1,
          limit: 10
        }
      }
    );
    
    console.log('✅ Vendor packages fetched successfully!');
    console.log('Total packages:', response.data.meta.total);
    console.log('Packages:', JSON.stringify(response.data.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching vendor packages:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get specific vendor package
async function getVendorPackageById(packageId) {
  try {
    console.log(`Fetching vendor package with ID: ${packageId}...`);
    
    const response = await axios.get(
      `${API_BASE_URL}/application/vendor-package/${packageId}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('✅ Vendor package fetched successfully!');
    console.log('Package details:', JSON.stringify(response.data.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching vendor package:', error.response?.data || error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Create a new vendor package
    const createdPackage = await createVendorPackage();
    
    // Get all vendor packages
    await getVendorPackages();
    
    // Get the specific package we just created
    if (createdPackage.data?.id) {
      await getVendorPackageById(createdPackage.data.id);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  main();
}

module.exports = {
  createVendorPackage,
  getVendorPackages,
  getVendorPackageById
}; 