# Transaction Timeout Solution

## 🚨 Problem
You're getting this error when creating a booking:
```json
{
  "success": false,
  "message": "Transaction API error: Unable to start a transaction in the given time."
}
```

## 🔍 Root Causes
1. **Database Connection Issues**: Too many concurrent connections
2. **Long Transaction Time**: Complex queries taking too long
3. **Lock Contention**: Other transactions holding locks
4. **Invalid Package ID**: Package doesn't exist or is not approved
5. **Missing Database Indexes**: Slow queries causing timeouts

## ✅ Solutions Applied

### 1. **Transaction Configuration**
```typescript
await this.prisma.$transaction(async (prisma) => {
  // ... transaction logic
}, {
  timeout: 30000, // 30 seconds timeout
  maxWait: 10000, // 10 seconds max wait
  isolationLevel: 'ReadCommitted', // Better performance
});
```

### 2. **Optimized Database Queries**
- **Batch Queries**: Fetch all packages at once instead of one by one
- **Selective Fields**: Only fetch needed fields
- **Better Error Handling**: More specific error messages

### 3. **Validation Improvements**
- Check if package exists and is approved
- Verify vendor account is active
- Validate all required data before transaction

## 🛠️ How to Test

### Step 1: Test Package Exists
```bash
# Test if your package ID is valid
node src/modules/application/booking/test-package.js cmdpiumjj0003jvu8su5td0lu
```

### Step 2: Create Booking with Valid Data
```http
POST http://localhost:5000/api/booking
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "booking_items": [
    {
      "package_id": "VALID_PACKAGE_ID",
      "start_date": "2024-02-15T00:00:00.000Z",
      "end_date": "2024-02-18T00:00:00.000Z",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "John Doe",
      "email": "john.doe@example.com"
    }
  ]
}
```

## 🔧 Database Optimizations

### 1. **Check Database Connections**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### 2. **Add Database Indexes** (if needed)
```sql
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packages_status_deleted ON packages(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
```

### 3. **Check Package Status**
```sql
-- Verify your package exists and is approved
SELECT p.id, p.name, p.status, p.deleted_at, u.name as vendor_name, u.status as vendor_status
FROM packages p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.id = 'cmdpiumjj0003jvu8su5td0lu';
```

## 🎯 Troubleshooting Steps

### 1. **Verify Package ID**
```bash
node src/modules/application/booking/test-package.js cmdpiumjj0003jvu8su5td0lu
```

### 2. **Check Database Health**
```bash
# Check if database is responsive
psql -h localhost -U your_user -d your_database -c "SELECT 1;"
```

### 3. **Monitor Transaction Logs**
```bash
# Check application logs for detailed error messages
tail -f logs/application.log
```

### 4. **Test with Simple Data**
```json
{
  "type": "hotel",
  "first_name": "Test",
  "last_name": "User",
  "email": "test@example.com",
  "booking_items": [
    {
      "package_id": "VALID_PACKAGE_ID",
      "start_date": "2024-12-15T00:00:00.000Z",
      "end_date": "2024-12-18T00:00:00.000Z",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Test User",
      "email": "test@example.com"
    }
  ]
}
```

## 🚀 Quick Fix Commands

### 1. **Test Package**
```bash
node src/modules/application/booking/test-package.js cmdpiumjj0003jvu8su5td0lu
```

### 2. **Get Available Packages**
```bash
node src/modules/application/booking/get-packages.js
```

### 3. **Create Booking with Valid Package**
```bash
curl -X POST "http://localhost:5000/api/booking" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @booking.json
```

## 📋 Common Issues & Solutions

### Issue 1: Package Not Found
**Solution**: Use a valid package ID from your database
```bash
node src/modules/application/booking/get-packages.js
```

### Issue 2: Package Not Approved
**Solution**: Approve the package in admin panel or use approved package

### Issue 3: Vendor Account Inactive
**Solution**: Activate vendor account or use package from active vendor

### Issue 4: Database Connection Issues
**Solution**: Check database server and connection pool settings

## 🎯 Expected Success Response
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_xyz789",
      "invoice_number": "INV-20241215-0001",
      "status": "pending",
      "type": "hotel",
      "total_amount": 750.00,
      "booking_date_time": "2024-12-15T10:30:00.000Z"
    },
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "vendor": {
      "id": "vendor_456",
      "name": "Hotel ABC",
      "email": "hotel@abc.com"
    }
  },
  "message": "Booking created successfully"
}
```

## 🔍 Debug Information

If you still get errors, check:
1. **Package ID**: Is it valid and approved?
2. **Database**: Is it running and accessible?
3. **Network**: Can your app connect to database?
4. **Logs**: Check application logs for detailed errors

The optimized code should now handle transactions much better and provide clearer error messages! 