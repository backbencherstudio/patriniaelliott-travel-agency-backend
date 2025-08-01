# Dynamic ID Processing Booking System

This system automatically processes all dynamic IDs (user_id, vendor_id, package_id) together based on your project's schema structure.

## 🎯 Overview

The booking system resolves all IDs dynamically without requiring hardcoded values:

- **user_id**: Automatically from JWT authentication
- **vendor_id**: Automatically from package relationships  
- **package_id**: From user request body

## 📋 Schema-Based Processing

### Database Relationships

```sql
-- User creates booking
User (id) → Booking (user_id)

-- Package owner becomes vendor
User (id) → Package (user_id) → Booking (vendor_id)

-- Package linked to booking items
Package (id) → BookingItem (package_id)
```

### Automatic ID Resolution Flow

1. **User Authentication** → `user_id` extracted from JWT
2. **Package Selection** → `package_id` from request body
3. **Vendor Resolution** → `vendor_id` from `package.user_id`
4. **Validation** → All relationships verified
5. **Booking Creation** → All IDs automatically populated

## 🚀 Usage Examples

### Basic Hotel Booking

```typescript
// Request Body
{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "booking_items": [
    {
      "package_id": "hotel_package_123", // User selects this
      "start_date": "2024-02-15",
      "end_date": "2024-02-18",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  ]
}

// System automatically resolves:
// - user_id: from JWT token
// - vendor_id: from package.user_id
// - package_id: from request body
```

### Tour Package Booking

```typescript
{
  "type": "tour",
  "booking_items": [
    {
      "package_id": "tour_package_456",
      "start_date": "2024-03-01",
      "end_date": "2024-03-05",
      "quantity": 2
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Alice Smith"
    },
    {
      "type": "adult", 
      "full_name": "Bob Smith"
    }
  ]
}
```

### Complex Multi-Package Booking

```typescript
{
  "type": "mixed",
  "booking_items": [
    {
      "package_id": "hotel_package_001",
      "start_date": "2024-04-10",
      "end_date": "2024-04-15",
      "packageRoomTypeId": "deluxe_room_001"
    },
    {
      "package_id": "activity_package_001",
      "start_date": "2024-04-12",
      "end_date": "2024-04-12"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "airport_transfer",
      "price": 75.00
    }
  ]
}
```

## 🔧 API Endpoints

### Create Booking
```http
POST /booking
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  // booking data with package_id
}
```

### Get All Bookings
```http
GET /booking?q=search&status=1
Authorization: Bearer <jwt_token>
```

### Get Specific Booking
```http
GET /booking/:id
Authorization: Bearer <jwt_token>
```

## 🛡️ Validation & Security

### Automatic Validations

1. **User Validation**
   - JWT token must be valid
   - User must exist in database

2. **Package Validation**
   - Package must exist and be approved (status = 1)
   - Package must not be deleted (deleted_at = null)
   - Room types must be available (if specified)

3. **Vendor Validation**
   - Vendor (package owner) must exist
   - Vendor must be active

4. **Date Validation**
   - Start date cannot be in the past
   - End date must be after start date
   - Dates must be available

5. **Extra Services Validation**
   - All extra services must exist
   - Prices must be valid

### Security Features

- **JWT Authentication**: All endpoints require valid JWT
- **User Isolation**: Users can only access their own bookings
- **Transaction Safety**: All operations wrapped in database transactions
- **Input Validation**: Comprehensive DTO validation with class-validator

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking_123",
      "invoice_number": "INV-20240215-0001",
      "status": "pending",
      "total_amount": 1500.00,
      "booking_date_time": "2024-02-15T10:00:00Z"
    },
    "user": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "vendor": {
      "id": "vendor_789",
      "name": "Hotel ABC",
      "email": "hotel@abc.com"
    },
    "items": [...],
    "travellers": [...],
    "extra_services": [...]
  },
  "message": "Booking created successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Package not found or not available"
}
```

## 🔄 Processing Flow

### Step-by-Step Process

1. **Request Received**
   ```typescript
   // Controller extracts user_id from JWT
   const user_id = req.user.userId;
   ```

2. **Package Validation**
   ```typescript
   // Service validates package and gets vendor_id
   const packageData = await prisma.package.findFirst({
     where: { id: package_id, status: 1, deleted_at: null },
     include: { user: true }
   });
   const vendor_id = packageData.user_id;
   ```

3. **Booking Creation**
   ```typescript
   // All IDs automatically populated
   const booking = await prisma.booking.create({
     data: {
       user_id,      // From JWT
       vendor_id,    // From package.user_id
       // ... other data
     }
   });
   ```

4. **Related Records**
   ```typescript
   // Booking items, travellers, extra services created
   await prisma.bookingItem.create({
     data: { booking_id: booking.id, package_id }
   });
   ```

## 🎨 Key Features

### ✅ Automatic ID Resolution
- No hardcoded IDs required
- All relationships resolved dynamically
- Schema-based processing

### ✅ Comprehensive Validation
- Multi-level validation checks
- Date and availability validation
- Business rule enforcement

### ✅ Transaction Safety
- All operations in database transactions
- Rollback on any failure
- Data consistency guaranteed

### ✅ Flexible Structure
- Supports multiple booking types
- Handles complex multi-package bookings
- Extensible for future requirements

### ✅ Security First
- JWT authentication required
- User isolation enforced
- Input sanitization and validation

## 🚀 Getting Started

1. **Ensure JWT Authentication** is configured
2. **Send booking request** with package_id
3. **System automatically** resolves all other IDs
4. **Receive complete booking** with all relationships

The system handles everything automatically - just provide the package_id and traveller information! 