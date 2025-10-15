const fs = require('fs');
const path = require('path');

console.log('🔨 Building application with assets...');

// First run the normal nest build
const { execSync } = require('child_process');

try {
  console.log('📦 Running nest build...');
  execSync('yarn build', { stdio: 'inherit' });
  
  console.log('📁 Copying public directory to dist...');
  
  // Function to copy directory recursively
  function copyDir(src, dest) {
    if (!fs.existsSync(src)) {
      console.log(`⚠️  Source directory ${src} does not exist`);
      return;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  // Copy public directory to dist/public
  const publicSrc = './public';
  const publicDest = './dist/public';
  
  if (fs.existsSync(publicSrc)) {
    copyDir(publicSrc, publicDest);
    console.log('✅ Public directory copied successfully');
    
    // Verify the copy
    const storagePath = path.join(publicDest, 'storage');
    if (fs.existsSync(storagePath)) {
      const dirs = fs.readdirSync(storagePath);
      console.log('📂 Copied storage directories:', dirs);
      
      // Check package directory specifically
      const packagePath = path.join(storagePath, 'package');
      if (fs.existsSync(packagePath)) {
        const files = fs.readdirSync(packagePath);
        console.log(`📄 Package directory has ${files.length} files`);
      }
    }
  } else {
    console.log('❌ Public directory not found');
  }
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
