# Booking Feedback System Guide

## 🎯 Overview

This system allows users to provide feedback and reviews for their bookings. Users can create, read, update, and delete feedback for their completed bookings.

## 📋 Available Endpoints

### **1. Create Feedback**
```http
POST /api/booking/feedback
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "booking_id": "booking_abc123",
  "rating_value": 4.5,
  "comment": "Great experience! The hotel was clean and staff was friendly.",
  "package_id": "package_xyz789" // Optional, auto-filled from booking
}
```

### **2. Get Feedback for Specific Booking**
```http
GET /api/booking/{booking_id}/feedback
Authorization: Bearer YOUR_JWT_TOKEN
```

### **3. Update Feedback**
```http
PUT /api/booking/{booking_id}/feedback
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "rating_value": 5.0,
  "comment": "Updated review: The hotel was excellent and exceeded expectations!"
}
```

### **4. Delete Feedback**
```http
DELETE /api/booking/{booking_id}/feedback
Authorization: Bearer YOUR_JWT_TOKEN
```

### **5. Get All User Feedback**
```http
GET /api/booking/feedback/all
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🛠️ How to Use

### **Step 1: Create Feedback for a Booking**

```bash
curl -X POST "http://localhost:5000/api/booking/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "booking_abc123",
    "rating_value": 4.5,
    "comment": "Great experience! The hotel was clean and staff was friendly."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "review_xyz789",
    "rating_value": 4.5,
    "comment": "Great experience! The hotel was clean and staff was friendly.",
    "created_at": "2025-01-08T11:30:00.000Z",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "booking": {
      "id": "booking_abc123",
      "invoice_number": "INV-20250108-0001",
      "type": "hotel"
    },
    "package": {
      "id": "package_xyz789",
      "name": "Luxury Beach Resort"
    }
  },
  "message": "Feedback created successfully"
}
```

### **Step 2: Get Feedback for a Booking**

```bash
curl -X GET "http://localhost:5000/api/booking/booking_abc123/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "review_xyz789",
    "rating_value": 4.5,
    "comment": "Great experience! The hotel was clean and staff was friendly.",
    "created_at": "2025-01-08T11:30:00.000Z",
    "updated_at": "2025-01-08T11:30:00.000Z",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "package": {
      "id": "package_xyz789",
      "name": "Luxury Beach Resort"
    }
  },
  "message": "Feedback retrieved successfully"
}
```

### **Step 3: Update Feedback**

```bash
curl -X PUT "http://localhost:5000/api/booking/booking_abc123/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating_value": 5.0,
    "comment": "Updated review: The hotel was excellent and exceeded expectations!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "review_xyz789",
    "rating_value": 5.0,
    "comment": "Updated review: The hotel was excellent and exceeded expectations!",
    "updated_at": "2025-01-08T12:00:00.000Z",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "booking": {
      "id": "booking_abc123",
      "invoice_number": "INV-20250108-0001",
      "type": "hotel"
    },
    "package": {
      "id": "package_xyz789",
      "name": "Luxury Beach Resort"
    }
  },
  "message": "Feedback updated successfully"
}
```

### **Step 4: Get All User Feedback**

```bash
curl -X GET "http://localhost:5000/api/booking/feedback/all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review_xyz789",
      "rating_value": 5.0,
      "comment": "Updated review: The hotel was excellent and exceeded expectations!",
      "created_at": "2025-01-08T11:30:00.000Z",
      "updated_at": "2025-01-08T12:00:00.000Z",
      "booking": {
        "id": "booking_abc123",
        "invoice_number": "INV-20250108-0001",
        "type": "hotel",
        "total_amount": 750.00,
        "booking_date_time": "2025-01-08T10:30:00.000Z"
      },
      "package": {
        "id": "package_xyz789",
        "name": "Luxury Beach Resort",
        "description": "5-star beachfront resort"
      }
    }
  ],
  "message": "User feedback retrieved successfully"
}
```

### **Step 5: Delete Feedback**

```bash
curl -X DELETE "http://localhost:5000/api/booking/booking_abc123/feedback" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Feedback deleted successfully"
}
```

## 📊 Rating System

### **Rating Values:**
- **1.0** = Very Poor
- **2.0** = Poor
- **3.0** = Average
- **4.0** = Good
- **5.0** = Excellent

### **Rating Validation:**
- Must be between 1.0 and 5.0
- Can include decimals (e.g., 4.5)
- Required field

## 🔒 Security Features

### **User Authorization:**
- Users can only create/update/delete feedback for their own bookings
- JWT token required for all operations
- Booking ownership verification

### **Data Validation:**
- Booking must exist and belong to user
- Only one feedback per booking per user
- Rating must be between 1-5
- Soft delete for feedback removal

## ⚠️ Error Handling

### **Common Error Responses:**

#### **Booking Not Found:**
```json
{
  "success": false,
  "message": "Booking not found or does not belong to you"
}
```

#### **Feedback Already Exists:**
```json
{
  "success": false,
  "message": "Feedback already exists for this booking"
}
```

#### **No Feedback Found:**
```json
{
  "success": false,
  "message": "No feedback found for this booking"
}
```

#### **Invalid Rating:**
```json
{
  "success": false,
  "message": "rating_value must not be less than 1"
}
```

## 🎯 Use Cases

### **1. After Trip Completion:**
- User completes their booking
- User provides feedback with rating and comment
- Feedback helps other users make decisions

### **2. Feedback Management:**
- User can update their feedback if needed
- User can delete feedback if they change their mind
- User can view all their past feedback

### **3. Vendor Insights:**
- Vendors can see feedback for their packages
- Helps vendors improve their services
- Builds trust with potential customers

## 📝 Postman Collection

### **Create Feedback:**
```http
POST {{base_url}}/booking/feedback
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "booking_id": "{{booking_id}}",
  "rating_value": 4.5,
  "comment": "Great experience! The hotel was clean and staff was friendly."
}
```

### **Get Feedback:**
```http
GET {{base_url}}/booking/{{booking_id}}/feedback
Authorization: Bearer {{jwt_token}}
```

### **Update Feedback:**
```http
PUT {{base_url}}/booking/{{booking_id}}/feedback
Authorization: Bearer {{jwt_token}}
Content-Type: application/json

{
  "rating_value": 5.0,
  "comment": "Updated review: The hotel was excellent!"
}
```

### **Delete Feedback:**
```http
DELETE {{base_url}}/booking/{{booking_id}}/feedback
Authorization: Bearer {{jwt_token}}
```

### **Get All Feedback:**
```http
GET {{base_url}}/booking/feedback/all
Authorization: Bearer {{jwt_token}}
```

## 🚀 Quick Test Flow

1. **Create a booking** → Get booking ID
2. **Create feedback** → Provide rating and comment
3. **Get feedback** → Verify feedback was created
4. **Update feedback** → Modify rating or comment
5. **Get all feedback** → View user's feedback history
6. **Delete feedback** → Remove feedback (optional)

The feedback system is now ready to use! 🎉 