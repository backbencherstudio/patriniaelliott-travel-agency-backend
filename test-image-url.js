const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Image URL Access...\n');

// Test with an existing image
const testImageName = '1760497968934_10df9731b9cac3ef9_1759900310395_d10749b95fad88e70_h4.webp';
const imagePath = path.join('dist', 'public', 'storage', 'package', testImageName);

console.log('📁 Testing image path:', imagePath);
console.log('✅ Image exists:', fs.existsSync(imagePath));

if (fs.existsSync(imagePath)) {
  const stats = fs.statSync(imagePath);
  console.log('📊 Image size:', Math.round(stats.size / 1024), 'KB');
  console.log('📅 Last modified:', stats.mtime);
}

// Expected URLs for your domain
console.log('\n🌐 Expected URLs:');
console.log('📍 Direct file access:');
console.log(`   https://backend.naamstay.com/public/storage/package/${testImageName}`);

console.log('\n📍 Storage endpoint:');
console.log(`   https://backend.naamstay.com/storage/package/${testImageName}`);

// Check if the image you mentioned exists
const requestedImage = '1760495681320_9830df8b48cfba84_3af71578b41810431053db21078c31ca565h1.jpg';
const requestedPath = path.join('dist', 'public', 'storage', 'package', requestedImage);

console.log('\n🔍 Checking requested image:');
console.log('📁 Requested image path:', requestedPath);
console.log('❌ Requested image exists:', fs.existsSync(requestedPath));

if (!fs.existsSync(requestedPath)) {
  console.log('\n💡 The specific image you mentioned does not exist in your local storage.');
  console.log('💡 You can use one of the existing images instead.');
  
  // List a few available images
  const packageDir = path.join('dist', 'public', 'storage', 'package');
  if (fs.existsSync(packageDir)) {
    const files = fs.readdirSync(packageDir);
    console.log('\n📄 Available images (first 5):');
    files.slice(0, 5).forEach(file => {
      console.log(`   ${file}`);
    });
  }
}

console.log('\n✅ Test completed!');
