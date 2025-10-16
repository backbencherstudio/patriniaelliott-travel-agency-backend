const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Image Serving Configuration...\n');

// Check if dist directory exists
const distExists = fs.existsSync('./dist');
console.log('📁 dist directory exists:', distExists);

if (distExists) {
  // Check if dist/public exists
  const distPublicExists = fs.existsSync('./dist/public');
  console.log('📁 dist/public directory exists:', distPublicExists);
  
  if (distPublicExists) {
    // Check if dist/public/storage exists
    const distStorageExists = fs.existsSync('./dist/public/storage');
    console.log('📁 dist/public/storage directory exists:', distStorageExists);
    
    if (distStorageExists) {
      // List contents of storage directory
      const storageContents = fs.readdirSync('./dist/public/storage');
      console.log('📂 Storage directory contents:', storageContents);
      
      // Check for specific image directories
      const imageDirs = ['blog', 'destination', 'package', 'website-info'];
      imageDirs.forEach(dir => {
        const dirPath = `./dist/public/storage/${dir}`;
        const exists = fs.existsSync(dirPath);
        console.log(`📁 ${dir} directory exists:`, exists);
        if (exists) {
          const files = fs.readdirSync(dirPath);
          console.log(`📄 ${dir} files:`, files.length > 0 ? files.slice(0, 5) : 'No files');
        }
      });
    }
  }
}

// Check source public directory
const publicExists = fs.existsSync('./public');
console.log('\n📁 Source public directory exists:', publicExists);

if (publicExists) {
  const storageExists = fs.existsSync('./public/storage');
  console.log('📁 Source public/storage directory exists:', storageExists);
  
  if (storageExists) {
    const storageContents = fs.readdirSync('./public/storage');
    console.log('📂 Source storage contents:', storageContents);
  }
}

// Check environment
console.log('\n🌍 Environment:', process.env.NODE_ENV || 'development');

// Expected paths based on environment
const nodeEnv = process.env.NODE_ENV || 'development';
const expectedPath = nodeEnv === 'production' 
  ? path.join(process.cwd(), 'dist', 'public', 'storage')
  : path.join(process.cwd(), 'public', 'storage');

console.log('📍 Expected storage path:', expectedPath);
console.log('📍 Expected storage exists:', fs.existsSync(expectedPath));

console.log('\n✅ Test completed!');
