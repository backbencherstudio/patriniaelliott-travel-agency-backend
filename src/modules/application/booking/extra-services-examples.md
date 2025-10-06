# Extra Services & Facilities - Complete Guide

## 🎯 Overview

এই guide এ আপনি শিখবেন কিভাবে booking system এ extra services এবং facilities add করতে হবে।

## 📋 Extra Services Types

### 1. Hotel Extra Services
- **Airport Transfer** - বিমানবন্দর থেকে হোটেল transport
- **Room Service** - রুমে খাবার delivery
- **Laundry Service** - কাপড় ধোয়ার service
- **Spa Services** - ম্যাসেজ, facial ইত্যাদি
- **Car Rental** - গাড়ি ভাড়া
- **Tour Guide** - গাইড service

### 2. Tour Package Extra Services
- **Photography Service** - Professional photography
- **Equipment Rental** - Camera, hiking gear ইত্যাদি
- **Meal Upgrades** - Premium meal options
- **Transportation** - Private car, bus ইত্যাদি
- **Insurance** - Travel insurance
- **Visa Assistance** - Visa processing help

## 🚀 How to Use Extra Services

### Step 1: Create Extra Services in Database

```sql
-- Insert extra services
INSERT INTO extra_services (id, name, description, price) VALUES
('airport_transfer', 'Airport Transfer', 'Pickup from airport to hotel', 50.00),
('room_service', 'Room Service', '24/7 room service available', 25.00),
('spa_massage', 'Spa Massage', 'Relaxing full body massage', 80.00),
('car_rental', 'Car Rental', 'Daily car rental service', 60.00),
('tour_guide', 'Tour Guide', 'Professional tour guide service', 100.00),
('photography', 'Photography Service', 'Professional photography session', 150.00);
```

### Step 2: Use in Booking Request

#### Example 1: Hotel Booking with Extra Services

```json
{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1234567890",
  "booking_items": [
    {
      "package_id": "hotel_package_123",
      "start_date": "2024-02-15T00:00:00.000Z",
      "end_date": "2024-02-18T00:00:00.000Z",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "airport_transfer",
      "price": 50.00,
      "quantity": 1,
      "notes": "Pickup from Terminal 1"
    },
    {
      "extra_service_id": "spa_massage",
      "price": 80.00,
      "quantity": 2,
      "notes": "Couple massage for 2 people"
    },
    {
      "extra_service_id": "car_rental",
      "price": 60.00,
      "quantity": 3,
      "notes": "3 days car rental"
    }
  ]
}
```

#### Example 2: Tour Package with Multiple Services

```json
{
  "type": "tour",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah@example.com",
  "booking_items": [
    {
      "package_id": "tour_package_456",
      "start_date": "2024-03-10T00:00:00.000Z",
      "end_date": "2024-03-15T00:00:00.000Z",
      "quantity": 2
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Sarah Johnson",
      "email": "sarah@example.com"
    },
    {
      "type": "adult",
      "full_name": "Mike Johnson",
      "email": "mike@example.com"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "tour_guide",
      "price": 100.00,
      "quantity": 1,
      "notes": "English speaking guide"
    },
    {
      "extra_service_id": "photography",
      "price": 150.00,
      "quantity": 1,
      "notes": "Professional photos of the tour"
    },
    {
      "extra_service_id": "equipment_rental",
      "price": 30.00,
      "quantity": 2,
      "notes": "Hiking gear for 2 people"
    }
  ]
}
```

## 💰 Price Calculation

### How Prices are Calculated:

1. **Package Price**: `package_price × quantity`
2. **Extra Services**: `service_price × quantity` (for each service)
3. **Total**: `package_total + all_extra_services_total`

### Example Calculation:

```
Hotel Package: $200 × 1 = $200
Airport Transfer: $50 × 1 = $50
Spa Massage: $80 × 2 = $160
Car Rental: $60 × 3 = $180

Total: $200 + $50 + $160 + $180 = $590
```

## 🔧 API Endpoints

### Create Booking with Extra Services
```http
POST /api/booking
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  // ... booking data with extra services
}
```

### Get Available Extra Services
```http
GET /api/extra-services
```

### Get Booking with Extra Services
```http
GET /api/booking/{booking_id}
```

## 📊 Database Structure

### ExtraService Table
```sql
CREATE TABLE extra_services (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  price DECIMAL(65,30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### BookingExtraService Table
```sql
CREATE TABLE booking_extra_services (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  extra_service_id TEXT,
  price DECIMAL(65,30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

## 🎯 Best Practices

### 1. Service Management
- Always validate extra service exists before booking
- Use database price as fallback if not provided
- Support quantity for services that can be ordered multiple times

### 2. Price Handling
- Allow custom pricing for special cases
- Validate price is reasonable (not negative)
- Store both original and final price

### 3. User Experience
- Show clear pricing breakdown
- Allow users to add/remove services before final booking
- Provide service descriptions and details

### 4. Business Logic
- Check service availability for booking dates
- Handle service conflicts (e.g., can't book spa if no room)
- Support service bundles and discounts

## 🚨 Common Issues & Solutions

### Issue 1: Service Not Found
```json
{
  "success": false,
  "message": "Extra service with ID spa_massage not found or inactive"
}
```
**Solution**: Check if service exists in database and is not deleted

### Issue 2: Price Calculation Error
```json
{
  "success": false,
  "message": "Invalid price calculation"
}
```
**Solution**: Ensure all prices are positive numbers

### Issue 3: Quantity Validation
```json
{
  "success": false,
  "message": "Quantity must be at least 1"
}
```
**Solution**: Validate quantity is positive integer

## 📱 Frontend Integration

### Service Selection Component
```javascript
// Example service selection
const selectedServices = [
  {
    id: 'airport_transfer',
    name: 'Airport Transfer',
    price: 50.00,
    quantity: 1
  },
  {
    id: 'spa_massage',
    name: 'Spa Massage',
    price: 80.00,
    quantity: 2
  }
];

// Calculate total
const totalExtraServices = selectedServices.reduce((sum, service) => {
  return sum + (service.price * service.quantity);
}, 0);
```

## 🔄 Future Enhancements

1. **Service Categories** - Group services by type
2. **Dynamic Pricing** - Time-based or demand-based pricing
3. **Service Packages** - Bundle multiple services with discount
4. **Availability Check** - Real-time service availability
5. **Service Reviews** - Allow users to rate services
6. **Recommendations** - Suggest services based on booking type

---

এই guide follow করে আপনি easily extra services এবং facilities add করতে পারবেন আপনার booking system এ। সব কিছু automatically calculate হবে এবং proper validation থাকবে।
