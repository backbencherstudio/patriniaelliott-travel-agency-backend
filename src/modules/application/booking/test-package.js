/**
 * Test script to verify package exists before creating booking
 * Run this to check if your package ID is valid
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPackage(packageId) {
  try {
    console.log(`🔍 Testing package ID: ${packageId}\n`);

    // Check if package exists
    const package = await prisma.package.findFirst({
      where: {
        id: packageId,
        status: 1, // Approved packages only
        deleted_at: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
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
      },
    });

    if (!package) {
      console.log('❌ Package not found or not available');
      console.log('💡 Possible reasons:');
      console.log('   - Package ID is incorrect');
      console.log('   - Package is not approved (status !== 1)');
      console.log('   - Package is deleted');
      return false;
    }

    console.log('✅ Package found!');
    console.log(`   Name: ${package.name}`);
    console.log(`   Type: ${package.type}`);
    console.log(`   Price: $${package.price}`);
    console.log(`   Status: ${package.status}`);
    console.log(`   Vendor: ${package.user?.name || 'Unknown'} (${package.user?.id})`);
    console.log(`   Vendor Status: ${package.user?.status}`);

    if (package.package_room_types.length > 0) {
      console.log(`   Room Types:`);
      package.package_room_types.forEach(room => {
        console.log(`     - ${room.name} (ID: ${room.id}) - $${room.price} - Max ${room.max_guests} guests`);
      });
    } else {
      console.log(`   Room Types: None available`);
    }

    // Check if vendor is active
    if (package.user?.status !== 1) {
      console.log('⚠️  Warning: Vendor account is not active');
      return false;
    }

    console.log('\n🎯 Package is ready for booking!');
    return true;

  } catch (error) {
    console.error('❌ Error testing package:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Get package ID from command line argument
const packageId = process.argv[2];

if (!packageId) {
  console.log('Usage: node test-package.js <package_id>');
  console.log('Example: node test-package.js cmdpiumjj0003jvu8su5td0lu');
  process.exit(1);
}

testPackage(packageId); 