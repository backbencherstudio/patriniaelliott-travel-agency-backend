const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🔍 Database Connection Diagnostic Tool\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const databaseUrl = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (databaseUrl) {
    console.log('✅ DATABASE_URL found in .env');
    console.log(`📍 Database URL: ${databaseUrl[1]}`);
    
    // Check if it's Neon
    if (databaseUrl[1].includes('neon.tech')) {
      console.log('⚠️  Using Neon database - this might be the issue');
    } else if (databaseUrl[1].includes('localhost')) {
      console.log('✅ Using local database');
    } else if (databaseUrl[1].includes('postgres')) {
      console.log('✅ Using Docker Compose database');
    }
  } else {
    console.log('❌ DATABASE_URL not found in .env');
  }
} else {
  console.log('❌ .env file not found');
}

// Check environment variable
const envDatabaseUrl = process.env.DATABASE_URL;
if (envDatabaseUrl) {
  console.log('✅ DATABASE_URL found in environment variables');
  console.log(`📍 Database URL: ${envDatabaseUrl}`);
} else {
  console.log('❌ DATABASE_URL not found in environment variables');
}

console.log('\n🔧 Testing Database Connection...\n');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    console.log('🔄 Attempting to connect to database...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database is working - Found ${userCount} users`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log('Error:', error.message);
    
    if (error.message.includes('neon.tech')) {
      console.log('\n💡 Solution: Your Neon database is not accessible.');
      console.log('Try one of these solutions:');
      console.log('1. Use local PostgreSQL: docker run --name postgres-local -e POSTGRES_PASSWORD=root -e POSTGRES_DB=backend -p 5432:5432 -d postgres:latest');
      console.log('2. Use Docker Compose: docker-compose up -d');
      console.log('3. Check your Neon database status at https://console.neon.tech');
    } else if (error.message.includes('localhost')) {
      console.log('\n💡 Solution: Local PostgreSQL is not running.');
      console.log('Start it with: docker run --name postgres-local -e POSTGRES_PASSWORD=root -e POSTGRES_DB=backend -p 5432:5432 -d postgres:latest');
    } else if (error.message.includes('postgres')) {
      console.log('\n💡 Solution: Docker Compose PostgreSQL is not running.');
      console.log('Start it with: docker-compose up -d');
    }
  }
}

testConnection(); 