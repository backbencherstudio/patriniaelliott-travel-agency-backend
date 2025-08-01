/**
 * Script to get available package IDs for testing
 * Run this script to get real package IDs from your database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAvailablePackages() {
  try {
    console.log('🔍 Fetching available packages...\n');

    // Get all approved packages
    const packages = await prisma.package.findMany({
      where: {
        status: 1, // Approved packages
        deleted_at: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        type: true,
        user_id: true,
        package_room_types: {
          where: {
            is_available: true,
            deleted_at: null,
          },
          select: {
            id: true,
            name: true,
            price: true,
            max_guests: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 10, // Limit to 10 packages
    });

    if (packages.length === 0) {
      console.log('❌ No approved packages found in database');
      console.log('💡 Please create some packages first or approve existing ones');
      return;
    }

    console.log(`✅ Found ${packages.length} approved packages:\n`);

    packages.forEach((pkg, index) => {
      console.log(`${index + 1}. Package ID: ${pkg.id}`);
      console.log(`   Name: ${pkg.name}`);
      console.log(`   Type: ${pkg.type}`);
      console.log(`   Price: $${pkg.price}`);
      console.log(`   Vendor: ${pkg.user?.name || 'Unknown'} (${pkg.user_id})`);
      
      if (pkg.package_room_types.length > 0) {
        console.log(`   Room Types:`);
        pkg.package_room_types.forEach(room => {
          console.log(`     - ${room.name} (ID: ${room.id}) - $${room.price} - Max ${room.max_guests} guests`);
        });
      }
      
      console.log('');
    });

    // Generate sample booking requests
    console.log('📝 Sample Booking Requests:\n');

    packages.forEach((pkg, index) => {
      console.log(`Sample ${index + 1}: ${pkg.type.toUpperCase()} Booking`);
      console.log('```http');
      console.log('POST http://localhost:3000/api/booking');
      console.log('Authorization: Bearer YOUR_JWT_TOKEN');
      console.log('Content-Type: application/json');
      console.log('');
      console.log('{');
      console.log(`  "type": "${pkg.type}",`);
      console.log('  "first_name": "Test",');
      console.log('  "last_name": "User",');
      console.log('  "email": "test@example.com",');
      console.log('  "booking_items": [');
      console.log('    {');
      console.log(`      "package_id": "${pkg.id}",`);
      console.log('      "start_date": "2024-02-15T00:00:00.000Z",');
      console.log('      "end_date": "2024-02-18T00:00:00.000Z",');
      console.log('      "quantity": 1');
      
      if (pkg.package_room_types.length > 0) {
        console.log(`      "packageRoomTypeId": "${pkg.package_room_types[0].id}"`);
      }
      
      console.log('    }');
      console.log('  ],');
      console.log('  "booking_travellers": [');
      console.log('    {');
      console.log('      "type": "adult",');
      console.log('      "full_name": "Test User",');
      console.log('      "email": "test@example.com"');
      console.log('    }');
      console.log('  ]');
      console.log('}');
      console.log('```\n');
    });

    // Generate curl commands
    console.log('🚀 Quick Test Commands:\n');
    
    packages.slice(0, 3).forEach((pkg, index) => {
      console.log(`Test ${index + 1}: ${pkg.name}`);
      console.log(`curl -X POST "http://localhost:3000/api/booking" \\`);
      console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{');
      console.log(`    "type": "${pkg.type}",`);
      console.log('    "first_name": "Test",');
      console.log('    "last_name": "User",');
      console.log('    "email": "test@example.com",');
      console.log('    "booking_items": [');
      console.log('      {');
      console.log(`        "package_id": "${pkg.id}",`);
      console.log('        "start_date": "2024-02-15T00:00:00.000Z",');
      console.log('        "end_date": "2024-02-18T00:00:00.000Z",');
      console.log('        "quantity": 1');
      if (pkg.package_room_types.length > 0) {
        console.log(`        "packageRoomTypeId": "${pkg.package_room_types[0].id}"`);
      }
      console.log('      }');
      console.log('    ],');
      console.log('    "booking_travellers": [');
      console.log('      {');
      console.log('        "type": "adult",');
      console.log('        "full_name": "Test User",');
      console.log('        "email": "test@example.com"');
      console.log('      }');
      console.log('    ]');
      console.log('  }\'');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error fetching packages:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getAvailablePackages(); 