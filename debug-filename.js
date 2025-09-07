const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFilenames() {
  try {
    console.log('🔍 Debugging package filenames in database...\n');

    // Get all package files
    const packageFiles = await prisma.packageFile.findMany({
      take: 10,
      select: {
        id: true,
        file: true,
        file_alt: true,
        type: true,
        package_id: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('📦 Package Files in Database:');
    packageFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ID: ${file.id}`);
      console.log(`     Filename: "${file.file}"`);
      console.log(`     Original Name: "${file.file_alt}"`);
      console.log(`     Type: ${file.type}`);
      console.log(`     Package ID: ${file.package_id}`);
      console.log(`     Created: ${file.created_at}`);
      console.log('');
    });

    // Get all trip plan images
    const tripPlanImages = await prisma.packageTripPlanImage.findMany({
      take: 10,
      select: {
        id: true,
        image: true,
        image_alt: true,
        package_trip_plan_id: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    console.log('📸 Trip Plan Images in Database:');
    tripPlanImages.forEach((image, index) => {
      console.log(`  ${index + 1}. ID: ${image.id}`);
      console.log(`     Filename: "${image.image}"`);
      console.log(`     Original Name: "${image.image_alt}"`);
      console.log(`     Trip Plan ID: ${image.package_trip_plan_id}`);
      console.log(`     Created: ${image.created_at}`);
      console.log('');
    });

    // Check for the specific filename mentioned in the error
    const specificFile = await prisma.packageFile.findFirst({
      where: {
        file: {
          startsWith: '4bac2f8e773ca4d5e27718ba9475b4caScreenshot'
        }
      }
    });

    if (specificFile) {
      console.log('🎯 Found the specific file mentioned in error:');
      console.log(`  ID: ${specificFile.id}`);
      console.log(`  Filename: "${specificFile.file}"`);
      console.log(`  Original Name: "${specificFile.file_alt}"`);
      console.log(`  Type: ${specificFile.type}`);
    } else {
      console.log('❌ File starting with "4bac2f8e773ca4d5e27718ba9475b4caScreenshot" not found in database');
    }

    // Check filesystem for comparison
    const fs = require('fs');
    const path = require('path');
    const storagePath = path.join(process.cwd(), 'public', 'storage', 'package');
    
    if (fs.existsSync(storagePath)) {
      const files = fs.readdirSync(storagePath);
      const matchingFiles = files.filter(f => f.startsWith('4bac2f8e773ca4d5e27718ba9475b4caScreenshot'));
      
      console.log('\n📁 Filesystem Check:');
      console.log(`  Storage path: ${storagePath}`);
      console.log(`  Total files: ${files.length}`);
      console.log(`  Matching files: ${matchingFiles.length}`);
      
      if (matchingFiles.length > 0) {
        console.log('  Matching filenames:');
        matchingFiles.forEach(file => {
          console.log(`    - "${file}"`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error debugging filenames:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugFilenames();
