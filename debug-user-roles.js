const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    console.log('🔍 Checking user roles in database...\n');
    
    // Get all users with their types
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        type: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('📊 Users in database:');
    console.table(users.map(user => ({
      id: user.id.substring(0, 8) + '...',
      email: user.email,
      name: user.name,
      type: user.type || 'user (default)',
      created: user.created_at.toISOString().split('T')[0]
    })));

    // Count by type
    const typeCounts = users.reduce((acc, user) => {
      const type = user.type || 'user';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 User type distribution:');
    console.table(typeCounts);

    // Check if there are admin users
    const adminUsers = users.filter(user => user.type === 'admin');
    const vendorUsers = users.filter(user => user.type === 'vendor');

    if (adminUsers.length === 0) {
      console.log('\n⚠️  WARNING: No admin users found!');
      console.log('To create an admin user, run:');
      console.log('UPDATE "users" SET type = \'admin\' WHERE email = \'your-email@example.com\';');
    }

    if (vendorUsers.length === 0) {
      console.log('\n⚠️  WARNING: No vendor users found!');
      console.log('To create a vendor user, run:');
      console.log('UPDATE "users" SET type = \'vendor\' WHERE email = \'vendor-email@example.com\';');
    }

    console.log('\n✅ User role check completed!');
    
  } catch (error) {
    console.error('❌ Error checking user roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
