# Package ID Based Booking Examples

This guide shows you how to get available packages and create bookings using real package IDs from your database.

## 🔍 Step 1: Get Available Packages

### Get All Approved Packages
```http
GET http://localhost:3000/api/packages
Authorization: Bearer {{jwt_token}}
```

### Get Packages by Type
```http
GET http://localhost:3000/api/packages?type=hotel
Authorization: Bearer {{jwt_token}}
```

### Search Packages
```http
GET http://localhost:3000/api/packages/search
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "search": "luxury",
  "destination_id": "dest_123",
  "category_id": "cat_456",
  "start_date": "2024-02-15",
  "end_date": "2024-02-18",
  "adults": 2,
  "children": 1,
  "min_price": 100,
  "max_price": 1000
}
```

## 📋 Step 2: Package Response Structure

When you get packages, you'll receive something like this:

```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "pkg_abc123",
        "name": "Luxury Beach Resort",
        "description": "5-star beachfront resort with all amenities",
        "price": 250.00,
        "type": "hotel",
        "status": 1,
        "user_id": "vendor_456",
        "package_room_types": [
          {
            "id": "room_001",
            "name": "Deluxe Ocean View",
            "price": 300.00,
            "max_guests": 4
          },
          {
            "id": "room_002", 
            "name": "Premium Suite",
            "price": 500.00,
            "max_guests": 6
          }
        ]
      },
      {
        "id": "pkg_def789",
        "name": "City Tour Package",
        "description": "Guided city tour with transportation",
        "price": 75.00,
        "type": "tour",
        "status": 1,
        "user_id": "vendor_789"
      }
    ]
  }
}
```

## 🎯 Step 3: Create Booking with Real Package IDs

### Example 1: Hotel Booking with Room Type

**Get Package First:**
```http
GET http://localhost:3000/api/packages/pkg_abc123
Authorization: Bearer {{jwt_token}}
```

**Create Booking:**
```http
POST http://localhost:3000/api/booking
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone_number": "+1234567890",
  "booking_items": [
    {
      "package_id": "pkg_abc123",
      "start_date": "2024-02-15T00:00:00.000Z",
      "end_date": "2024-02-18T00:00:00.000Z",
      "quantity": 1,
      "packageRoomTypeId": "room_001"
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "John Doe",
      "email": "john.doe@example.com"
    },
    {
      "type": "adult",
      "full_name": "Jane Doe", 
      "email": "jane.doe@example.com"
    }
  ]
}
```

### Example 2: Tour Package Booking

**Create Booking:**
```http
POST http://localhost:3000/api/booking
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "type": "tour",
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice.smith@example.com",
  "booking_items": [
    {
      "package_id": "pkg_def789",
      "start_date": "2024-03-01T00:00:00.000Z",
      "end_date": "2024-03-01T00:00:00.000Z",
      "quantity": 2
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Alice Smith",
      "email": "alice.smith@example.com"
    },
    {
      "type": "adult",
      "full_name": "Bob Smith",
      "email": "bob.smith@example.com"
    }
  ]
}
```

### Example 3: Multi-Package Booking

**Create Booking:**
```http
POST http://localhost:3000/api/booking
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "type": "mixed",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.johnson@example.com",
  "booking_items": [
    {
      "package_id": "pkg_abc123",
      "start_date": "2024-04-10T00:00:00.000Z",
      "end_date": "2024-04-15T00:00:00.000Z",
      "quantity": 1,
      "packageRoomTypeId": "room_002"
    },
    {
      "package_id": "pkg_def789",
      "start_date": "2024-04-12T00:00:00.000Z",
      "end_date": "2024-04-12T00:00:00.000Z",
      "quantity": 2
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Sarah Johnson",
      "email": "sarah.johnson@example.com"
    },
    {
      "type": "adult",
      "full_name": "Mike Johnson",
      "email": "mike.johnson@example.com"
    }
  ]
}
```

## 🔧 Step 4: Complete Testing Flow

### 1. Get Available Packages
```bash
# First, get all available packages
curl -X GET "http://localhost:3000/api/packages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Select Package ID
From the response, copy a package ID like `pkg_abc123`

### 3. Create Booking
```bash
curl -X POST "http://localhost:3000/api/booking" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "hotel",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "booking_items": [
      {
        "package_id": "pkg_abc123",
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
  }'
```

## 📊 Expected Booking Response

```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_xyz789",
      "invoice_number": "INV-20240215-0001",
      "status": "pending",
      "type": "hotel",
      "total_amount": 900.00,
      "user_id": "user_123",
      "vendor_id": "vendor_456"
    },
    "user": {
      "id": "user_123",
      "name": "Test User",
      "email": "test@example.com"
    },
    "vendor": {
      "id": "vendor_456",
      "name": "Luxury Beach Resort",
      "email": "resort@example.com"
    },
    "items": [
      {
        "id": "item_001",
        "package_id": "pkg_abc123",
        "package": {
          "id": "pkg_abc123",
          "name": "Luxury Beach Resort",
          "description": "5-star beachfront resort"
        }
      }
    ],
    "travellers": [
      {
        "id": "traveller_001",
        "type": "adult",
        "full_name": "Test User"
      }
    ]
  },
  "message": "Booking created successfully"
}
```

## 🎯 Key Points

### Package ID Requirements:
- Must exist in database
- Must have `status: 1` (approved)
- Must not be deleted (`deleted_at: null`)
- Must be available for the requested dates

### Dynamic ID Processing:
- **user_id**: Automatically from JWT token
- **vendor_id**: Automatically from `package.user_id`
- **package_id**: You provide this from available packages

### Validation:
- Package exists and approved
- Room type available (if specified)
- Dates are valid and available
- Guest capacity within limits

## 🚀 Quick Test Script

```bash
#!/bin/bash

# 1. Login and get JWT token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | \
  jq -r '.data.access_token')

echo "JWT Token: $TOKEN"

# 2. Get available packages
PACKAGES=$(curl -s -X GET "http://localhost:3000/api/packages" \
  -H "Authorization: Bearer $TOKEN")

echo "Available packages:"
echo $PACKAGES | jq '.data.packages[] | {id, name, price, type}'

# 3. Get first package ID
PACKAGE_ID=$(echo $PACKAGES | jq -r '.data.packages[0].id')

echo "Using package ID: $PACKAGE_ID"

# 4. Create booking
BOOKING=$(curl -s -X POST "http://localhost:3000/api/booking" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"hotel\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\",
    \"email\": \"test@example.com\",
    \"booking_items\": [
      {
        \"package_id\": \"$PACKAGE_ID\",
        \"start_date\": \"2024-02-15T00:00:00.000Z\",
        \"end_date\": \"2024-02-18T00:00:00.000Z\",
        \"quantity\": 1
      }
    ],
    \"booking_travellers\": [
      {
        \"type\": \"adult\",
        \"full_name\": \"Test User\",
        \"email\": \"test@example.com\"
      }
    ]
  }")

echo "Booking created:"
echo $BOOKING | jq '.'
```

This approach ensures you're using real, valid package IDs from your database for testing! 