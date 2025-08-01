# Package ID Based Booking Guide

This guide shows you how to create bookings using real package IDs from your database.

## 🎯 Quick Start

### Step 1: Get Available Packages
```bash
# Run the script to get real package IDs
node src/modules/application/booking/get-packages.js
```

### Step 2: Use Package ID in Booking
```http
POST http://localhost:3000/api/booking
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "hotel",
  "first_name": "Test",
  "last_name": "User", 
  "email": "test@example.com",
  "booking_items": [
    {
      "package_id": "REAL_PACKAGE_ID_FROM_DATABASE",
      "start_date": "2024-02-15T00:00:00.000Z",
      "end_date": "2024-02-18T00:00:00.000Z",
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

## 🔍 How It Works

1. **Get Package IDs**: Use the script to get real package IDs from your database
2. **Create Booking**: Use those package IDs in your booking request
3. **System Processes**: 
   - `user_id` = from JWT token
   - `vendor_id` = from package.user_id
   - `package_id` = from your request

## 📋 Package Requirements

- Must exist in database
- Must have `status: 1` (approved)
- Must not be deleted
- Must be available for requested dates

## 🚀 Testing Flow

1. **Login** → Get JWT token
2. **Run Script** → Get package IDs
3. **Create Booking** → Use real package ID
4. **Verify** → Check booking created successfully

## 💡 Key Points

- **No hardcoded IDs**: Use real package IDs from database
- **Automatic processing**: user_id and vendor_id resolved automatically
- **Validation**: System validates package exists and is available
- **Flexible**: Works with any approved package in your system

The system handles everything automatically - just provide a valid package_id! 