# Database Connection Fix Guide

## 🚨 Problem Identified

Your application is trying to connect to a Neon database but failing:
```
Can't reach database server at `ep-bitter-tooth-ads9z370-pooler.c-2.us-east-1.aws.neon.tech:5432`
```

## 🔍 Root Causes & Solutions

### **1. Check Your Environment Variables**

First, check if you have a `.env` file in your project root:

```bash
# Check if .env file exists
ls -la | grep .env

# If no .env file exists, create one
touch .env
```

### **2. Verify DATABASE_URL**

Your `DATABASE_URL` should be set in your `.env` file. Check what's currently set:

```bash
# Check current DATABASE_URL
echo $DATABASE_URL

# Or check in your .env file
cat .env | grep DATABASE_URL
```

### **3. Database Connection Options**

You have several options to fix this:

#### **Option A: Use Local PostgreSQL (Recommended for Development)**

1. **Install PostgreSQL locally** or use Docker:

```bash
# Using Docker (if you have Docker installed)
docker run --name postgres-local -e POSTGRES_PASSWORD=root -e POSTGRES_DB=backend -p 5432:5432 -d postgres:latest
```

2. **Update your `.env` file**:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/backend"
```

3. **Run database migrations**:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Or if you want to reset the database
npx prisma migrate reset
```

#### **Option B: Use Docker Compose (Already Configured)**

Your project already has a `docker-compose.yml` file configured:

```bash
# Start all services (PostgreSQL + Redis + App)
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs postgres
```

#### **Option C: Fix Neon Database Connection**

If you want to use Neon database:

1. **Check Neon Dashboard**:
   - Go to [Neon Console](https://console.neon.tech)
   - Verify your project is active
   - Get the correct connection string

2. **Update your `.env` file** with the correct Neon URL:

```env
DATABASE_URL="postgresql://username:password@ep-bitter-tooth-ads9z370-pooler.c-2.us-east-1.aws.neon.tech:5432/database_name?sslmode=require"
```

3. **Test the connection**:

```bash
# Test with psql (if installed)
psql "postgresql://username:password@ep-bitter-tooth-ads9z370-pooler.c-2.us-east-1.aws.neon.tech:5432/database_name?sslmode=require"

# Or test with Prisma
npx prisma db pull
```

## 🛠️ Step-by-Step Fix

### **Step 1: Create/Update .env File**

```bash
# Create .env file if it doesn't exist
touch .env
```

Add this to your `.env` file:

```env
# For Local PostgreSQL
DATABASE_URL="postgresql://postgres:root@localhost:5432/backend"

# For Docker Compose
# DATABASE_URL="postgresql://postgres:root@postgres/backend"

# For Neon (replace with your actual credentials)
# DATABASE_URL="postgresql://username:password@ep-bitter-tooth-ads9z370-pooler.c-2.us-east-1.aws.neon.tech:5432/database_name?sslmode=require"

# Other required environment variables
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h
```

### **Step 2: Choose Your Database Setup**

#### **For Local Development (Recommended)**:

```bash
# Start PostgreSQL with Docker
docker run --name postgres-local -e POSTGRES_PASSWORD=root -e POSTGRES_DB=backend -p 5432:5432 -d postgres:latest

# Wait a few seconds for PostgreSQL to start
sleep 5

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

#### **For Docker Compose**:

```bash
# Start all services
docker-compose up -d

# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### **Step 3: Test Database Connection**

```bash
# Test Prisma connection
npx prisma db pull

# Or test with a simple query
npx prisma studio
```

### **Step 4: Restart Your Application**

```bash
# Stop your current application (if running)
# Then restart it

# If using npm
npm run start:dev

# If using yarn
yarn start:dev

# If using Docker Compose
docker-compose restart app
```

## 🔧 Troubleshooting

### **Check Database Status**

```bash
# If using local PostgreSQL
docker ps | grep postgres

# If using Docker Compose
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres
```

### **Test Connection Manually**

```bash
# Test with psql
psql "postgresql://postgres:root@localhost:5432/backend"

# Test with Prisma
npx prisma db pull
```

### **Common Issues & Solutions**

#### **1. Port Already in Use**:
```bash
# Check what's using port 5432
lsof -i :5432

# Kill the process or use a different port
docker run --name postgres-local -e POSTGRES_PASSWORD=root -e POSTGRES_DB=backend -p 5433:5432 -d postgres:latest
```

#### **2. Database Doesn't Exist**:
```bash
# Connect to PostgreSQL and create database
psql -h localhost -U postgres
CREATE DATABASE backend;
\q
```

#### **3. Permission Issues**:
```bash
# Check file permissions
ls -la .env

# Fix permissions if needed
chmod 600 .env
```

## 🚀 Quick Fix Commands

### **Option 1: Local PostgreSQL (Fastest)**

```bash
# 1. Start PostgreSQL
docker run --name postgres-local -e POSTGRES_PASSWORD=root -e POSTGRES_DB=backend -p 5432:5432 -d postgres:latest

# 2. Update .env
echo 'DATABASE_URL="postgresql://postgres:root@localhost:5432/backend"' > .env

# 3. Setup database
npx prisma generate
npx prisma migrate dev

# 4. Restart your app
yarn start:dev
```

### **Option 2: Docker Compose**

```bash
# 1. Start all services
docker-compose up -d

# 2. Check status
docker-compose ps

# 3. Restart your app
yarn start:dev
```

## ✅ Verification

After fixing the database connection, test your feedback endpoint:

```bash
curl -X GET "http://localhost:5000/api/booking/cmdsdw5ck0001jvqg59e629l9/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

You should get a proper response instead of the database connection error.

## 📞 Need Help?

If you're still having issues:

1. **Check your `.env` file** - Make sure `DATABASE_URL` is correct
2. **Verify database is running** - Use the status commands above
3. **Check application logs** - Look for connection errors
4. **Test with Prisma Studio** - `npx prisma studio` to verify connection

The most likely solution is to use the local PostgreSQL setup or Docker Compose, as these are more reliable for development than external cloud databases. 