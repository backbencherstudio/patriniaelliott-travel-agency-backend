// Test Reviews Debug
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testReviewsDebug() {
  try {
    console.log('🔍 Testing Reviews Package Data...\n');
    
    // Get a review with package data
    const review = await prisma.review.findFirst({
      select: {
        id: true,
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            package_files: {
              select: {
                id: true,
                file: true,
                file_alt: true,
                type: true,
                is_featured: true,
              },
              take: 1,
            },
          },
        },
      },
    });
    
    if (!review) {
      console.log('❌ No reviews found');
      return;
    }
    
    console.log('📦 Review Package Data:');
    console.log('Review ID:', review.id);
    console.log('Package ID:', review.package.id);
    console.log('Package Name:', review.package.name);
    console.log('Package Type:', review.package.type);
    console.log('Package Files:', review.package.package_files);
    
    if (review.package.package_files && review.package.package_files.length > 0) {
      console.log('\n✅ Package has files:');
      review.package.package_files.forEach((file, index) => {
        console.log(`${index + 1}. File: ${file.file}`);
        console.log(`   Alt: ${file.file_alt}`);
        console.log(`   Type: ${file.type}`);
        console.log(`   Featured: ${file.is_featured}`);
      });
    } else {
      console.log('\n❌ Package has no files');
    }
    
    // Check if package has any files at all
    const allPackageFiles = await prisma.packageFile.findMany({
      where: {
        package_id: review.package.id,
      },
      select: {
        id: true,
        file: true,
        file_alt: true,
        type: true,
        is_featured: true,
      },
    });
    
    console.log('\n📁 All Package Files in Database:');
    if (allPackageFiles.length > 0) {
      allPackageFiles.forEach((file, index) => {
        console.log(`${index + 1}. File: ${file.file}`);
        console.log(`   Alt: ${file.file_alt}`);
        console.log(`   Type: ${file.type}`);
        console.log(`   Featured: ${file.is_featured}`);
      });
    } else {
      console.log('❌ No files found in database for this package');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testReviewsDebug();
