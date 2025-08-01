# Postman Guide: Dynamic ID Processing Booking System

This guide shows you exactly how to test the booking system using Postman with real examples.

## 🔧 Setup Requirements

### 1. Base URL
```
http://localhost:3000/api
```

### 2. Authentication
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <your_jwt_token>`
- **Content-Type**: `application/json`

### 3. Get JWT Token First
Before testing booking endpoints, you need to authenticate and get a JWT token.

## 🔐 Step 1: Authentication (Get JWT Token)

### Login Request
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

### Response
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

**Copy the `access_token` value for use in subsequent requests.**

## 📝 Step 2: Create Booking

### Basic Hotel Booking

**Request:**
```http
POST http://localhost:3000/api/booking
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "hotel",
  "status": "pending",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone_number": "+1234567890",
  "address1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "USA",
  "comments": "Early check-in preferred",
  "booking_items": [
    {
      "package_id": "package_123",
      "start_date": "2024-02-15T00:00:00.000Z",
      "end_date": "2024-02-18T00:00:00.000Z",
      "quantity": 1,
      "packageRoomTypeId": "room_type_456"
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "gender": "male",
      "full_name": "John Doe",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone_number": "+1234567890"
    },
    {
      "type": "child",
      "gender": "female",
      "full_name": "Jane Doe",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane.doe@example.com"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "service_789",
      "price": 50.00
    }
  ]
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_abc123",
      "invoice_number": "INV-20240215-0001",
      "status": "pending",
      "type": "hotel",
      "total_amount": 1550.00,
      "booking_date_time": "2024-02-15T10:30:00.000Z"
    },
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "vendor": {
      "id": "vendor_456",
      "name": "Hotel ABC",
      "email": "hotel@abc.com"
    },
    "items": [
      {
        "id": "item_001",
        "package_id": "package_123",
        "start_date": "2024-02-15T00:00:00.000Z",
        "end_date": "2024-02-18T00:00:00.000Z",
        "quantity": 1,
        "price": 1500.00,
        "package": {
          "id": "package_123",
          "name": "Deluxe Hotel Package",
          "description": "Luxury hotel stay with amenities"
        },
        "PackageRoomType": {
          "id": "room_type_456",
          "name": "Deluxe Sea View",
          "description": "Beautiful ocean view room"
        }
      }
    ],
    "travellers": [
      {
        "id": "traveller_001",
        "type": "adult",
        "gender": "male",
        "full_name": "John Doe",
        "email": "john.doe@example.com"
      },
      {
        "id": "traveller_002",
        "type": "child",
        "gender": "female",
        "full_name": "Jane Doe",
        "email": "jane.doe@example.com"
      }
    ],
    "extra_services": [
      {
        "id": "extra_001",
        "extra_service_id": "service_789",
        "price": 50.00,
        "extra_service": {
          "id": "service_789",
          "name": "Airport Transfer",
          "description": "Round trip airport transfer"
        }
      }
    ]
  },
  "message": "Booking created successfully"
}
```

### Tour Package Booking

**Request:**
```http
POST http://localhost:3000/api/booking
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "tour",
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice.smith@example.com",
  "phone_number": "+1987654321",
  "booking_items": [
    {
      "package_id": "tour_package_001",
      "start_date": "2024-03-01T00:00:00.000Z",
      "end_date": "2024-03-05T00:00:00.000Z",
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

### Complex Multi-Package Booking

**Request:**
```http
POST http://localhost:3000/api/booking
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "type": "mixed",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah.johnson@example.com",
  "booking_items": [
    {
      "package_id": "hotel_package_001",
      "start_date": "2024-04-10T00:00:00.000Z",
      "end_date": "2024-04-15T00:00:00.000Z",
      "quantity": 1,
      "packageRoomTypeId": "deluxe_room_001"
    },
    {
      "package_id": "activity_package_001",
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
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "airport_transfer",
      "price": 75.00
    },
    {
      "extra_service_id": "guided_tour",
      "price": 120.00
    }
  ]
}
```

## 📋 Step 3: Get All Bookings

### Get All User Bookings

**Request:**
```http
GET http://localhost:3000/api/booking
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get Bookings with Filters

**Request:**
```http
GET http://localhost:3000/api/booking?q=hotel&status=1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `q`: Search query (invoice number, name)
- `status`: Booking status filter
- `approve`: Approval status filter

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking_abc123",
      "invoice_number": "INV-20240215-0001",
      "status": "pending",
      "total_amount": 1550.00,
      "booking_date_time": "2024-02-15T10:30:00.000Z",
      "vendor": {
        "id": "vendor_456",
        "name": "Hotel ABC",
        "email": "hotel@abc.com"
      },
      "booking_items": [
        {
          "package": {
            "id": "package_123",
            "name": "Deluxe Hotel Package",
            "description": "Luxury hotel stay"
          }
        }
      ],
      "booking_travellers": [...],
      "booking_extra_services": [...]
    }
  ],
  "message": "Bookings retrieved successfully"
}
```

## 🔍 Step 4: Get Specific Booking

### Get Single Booking

**Request:**
```http
GET http://localhost:3000/api/booking/booking_abc123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "booking_abc123",
    "invoice_number": "INV-20240215-0001",
    "status": "pending",
    "type": "hotel",
    "total_amount": 1550.00,
    "booking_date_time": "2024-02-15T10:30:00.000Z",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "vendor": {
      "id": "vendor_456",
      "name": "Hotel ABC",
      "email": "hotel@abc.com"
    },
    "booking_items": [
      {
        "id": "item_001",
        "package_id": "package_123",
        "start_date": "2024-02-15T00:00:00.000Z",
        "end_date": "2024-02-18T00:00:00.000Z",
        "quantity": 1,
        "price": 1500.00,
        "package": {
          "id": "package_123",
          "name": "Deluxe Hotel Package",
          "description": "Luxury hotel stay with amenities"
        },
        "PackageRoomType": {
          "id": "room_type_456",
          "name": "Deluxe Sea View",
          "description": "Beautiful ocean view room"
        }
      }
    ],
    "booking_travellers": [...],
    "booking_extra_services": [...]
  },
  "message": "Booking retrieved successfully"
}
```

## ⚠️ Error Responses

### Package Not Found
```json
{
  "success": false,
  "message": "Package with ID package_999 not found or not available"
}
```

### Invalid Dates
```json
{
  "success": false,
  "message": "Start date cannot be in the past"
}
```

### Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Validation Error
```json
{
  "statusCode": 400,
  "message": [
    "booking_items should not be empty",
    "booking_travellers should not be empty"
  ]
}
```

## 🎯 Postman Collection Setup

### 1. Create Environment Variables
```
BASE_URL: http://localhost:3000/api
JWT_TOKEN: {{your_jwt_token_here}}
```

### 2. Pre-request Script (for Login)
```javascript
// Set JWT token after login
pm.test("Set JWT Token", function () {
    var jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.access_token) {
        pm.environment.set("JWT_TOKEN", jsonData.data.access_token);
    }
});
```

### 3. Authorization Setup
- **Type**: Bearer Token
- **Token**: `{{JWT_TOKEN}}`

## 🔧 Testing Checklist

### ✅ Authentication
- [ ] Login and get JWT token
- [ ] Set Authorization header
- [ ] Verify token is valid

### ✅ Create Booking
- [ ] Test basic hotel booking
- [ ] Test tour package booking
- [ ] Test multi-package booking
- [ ] Test with extra services
- [ ] Test with room types

### ✅ Validation
- [ ] Test with invalid package_id
- [ ] Test with past dates
- [ ] Test with missing required fields
- [ ] Test with invalid room type

### ✅ Get Bookings
- [ ] Test get all bookings
- [ ] Test with search filters
- [ ] Test get specific booking
- [ ] Test unauthorized access

## 🚀 Quick Test Flow

1. **Login** → Get JWT token
2. **Create Booking** → Test dynamic ID processing
3. **Get All Bookings** → Verify booking created
4. **Get Specific Booking** → Check all relationships
5. **Test Error Cases** → Validate error handling

## 📝 Notes

- **user_id**: Automatically from JWT token
- **vendor_id**: Automatically from package.user_id
- **package_id**: Must be valid and approved
- **Dates**: Must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Prices**: Should be numbers (not strings)
- **Status**: Defaults to "pending" if not provided

The system handles all ID resolution automatically - just provide valid package_id and traveller information! 