// Test script for Application Vendor Package API
// This demonstrates how to use the public vendor package endpoints

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Update with your actual API URL

// Test data
const testSearchParams = {
  search: 'luxury',
  min_price: 100,
  max_price: 1000,
  adults: 2,
  children: 1,
  rooms: 1,
  page: 1,
  limit: 5,
  sort_by: 'price_asc'
};

// Function to search vendor packages
async function searchVendorPackages() {
  try {
    console.log('🔍 Searching vendor packages...');
    
    const response = await axios.get(`${API_BASE_URL}/application/vendor-package`, {
      params: testSearchParams
    });

    console.log('✅ Vendor packages search successful!');
    console.log('📊 Results:', response.data.data.packages.length, 'packages found');
    console.log('📄 Pagination:', response.data.data.pagination);
    
    if (response.data.data.packages.length > 0) {
      console.log('🏠 First package:', {
        id: response.data.data.packages[0].id,
        name: response.data.data.packages[0].name,
        price: response.data.data.packages[0].price,
        vendor: response.data.data.packages[0].user?.display_name
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error searching vendor packages:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get vendor package by ID
async function getVendorPackageById(packageId) {
  try {
    console.log(`📦 Fetching vendor package with ID: ${packageId}...`);
    
    const response = await axios.get(`${API_BASE_URL}/application/vendor-package/${packageId}`);
    
    console.log('✅ Vendor package details fetched successfully!');
    console.log('🏠 Package details:', {
      id: response.data.data.id,
      name: response.data.data.name,
      price: response.data.data.price,
      vendor: response.data.data.user?.display_name,
      location: `${response.data.data.city}, ${response.data.data.country}`,
      rooms: response.data.data.package_room_types?.length || 0,
      reviews: response.data.data._count?.reviews || 0
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching vendor package:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get vendor packages by vendor ID
async function getVendorPackagesByVendor(vendorId) {
  try {
    console.log(`👤 Fetching packages for vendor ID: ${vendorId}...`);
    
    const response = await axios.get(`${API_BASE_URL}/application/vendor-package/vendor/${vendorId}`, {
      params: {
        page: 1,
        limit: 5
      }
    });

    console.log('✅ Vendor packages fetched successfully!');
    console.log('📊 Results:', response.data.data.packages.length, 'packages found');
    console.log('📄 Pagination:', response.data.data.pagination);

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching vendor packages by vendor:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get featured vendor packages
async function getFeaturedVendorPackages() {
  try {
    console.log('⭐ Fetching featured vendor packages...');
    
    const response = await axios.get(`${API_BASE_URL}/application/vendor-package/featured/list`, {
      params: {
        limit: 5
      }
    });

    console.log('✅ Featured vendor packages fetched successfully!');
    console.log('📊 Results:', response.data.data.length, 'featured packages found');
    
    if (response.data.data.length > 0) {
      console.log('🏠 Featured packages:');
      response.data.data.forEach((pkg, index) => {
        console.log(`  ${index + 1}. ${pkg.name} - $${pkg.price} (${pkg.user?.display_name})`);
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching featured vendor packages:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Application Vendor Package API Tests...\n');

  try {
    // Test 1: Search vendor packages
    console.log('=== Test 1: Search Vendor Packages ===');
    const searchResults = await searchVendorPackages();
    
    // Test 2: Get featured packages
    console.log('\n=== Test 2: Get Featured Packages ===');
    await getFeaturedVendorPackages();

    // Test 3: Get specific package details (if we have results)
    if (searchResults.data.packages.length > 0) {
      console.log('\n=== Test 3: Get Package Details ===');
      const firstPackageId = searchResults.data.packages[0].id;
      await getVendorPackageById(firstPackageId);

      // Test 4: Get packages by vendor (if we have vendor info)
      if (searchResults.data.packages[0].user?.id) {
        console.log('\n=== Test 4: Get Packages by Vendor ===');
        const vendorId = searchResults.data.packages[0].user.id;
        await getVendorPackagesByVendor(vendorId);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Export functions for individual testing
module.exports = {
  searchVendorPackages,
  getVendorPackageById,
  getVendorPackagesByVendor,
  getFeaturedVendorPackages,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
} 