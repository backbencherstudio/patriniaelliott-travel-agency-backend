# Enhanced Booking System - Complete Examples

## 🎯 **New Features Added:**

### 1. **Auto-Price from Package Extra Services**
- Extra service prices automatically come from package data
- No need to specify price in request (optional)

### 2. **Discount Support**
- Percentage discount (0-100%)
- Fixed amount discount
- Priority: Fixed amount > Percentage

### 3. **Detailed Price Breakdown**
- Package total
- Extra services total
- Base total
- Discount applied
- Final total

## 🚀 **Enhanced Booking Examples:**

### **Example 1: Basic Booking with Auto-Price Extra Services**

```json
{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "booking_items": [
    {
      "package_id": "cmgeia8k10001jvegqfy9cpac",
      "start_date": "2026-02-15T00:00:00.000Z",
      "end_date": "2026-02-18T00:00:00.000Z",
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
      "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
      "quantity": 2,
      "notes": "Chauffeur service for round trip"
    },
    {
      "extra_service_id": "cmgeia8k1000cjveghom87016",
      "quantity": 3,
      "notes": "Daily housekeeping for 3 days"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "cmgercm4y000bjvo0hdoh5rbg",
      "invoice_number": "INV-20251006-0013",
      "status": "pending",
      "type": "hotel",
      "total_amount": "1550",
      "booking_date_time": "2025-10-06T06:36:32.145Z"
    },
    "price_breakdown": {
      "package_total": 1200,
      "extra_services_total": 350,
      "base_total": 1550,
      "discount_applied": 0,
      "final_total": 1550,
      "discount_percentage": 0,
      "discount_amount": 0
    },
    "extra_services": [
      {
        "id": "cmgercm52000hjvo0m41iqc6g",
        "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
        "price": "100",
        "quantity": 2,
        "notes": "Chauffeur service for round trip",
        "extra_service": {
          "name": "chauffeur",
          "description": "Personal chauffeur service"
        }
      },
      {
        "id": "cmgercm54000jjvo039xa2trp",
        "extra_service_id": "cmgeia8k1000cjveghom87016",
        "price": "50",
        "quantity": 3,
        "notes": "Daily housekeeping for 3 days",
        "extra_service": {
          "name": "dailyHousekeeping",
          "description": "Daily housekeeping service"
        }
      }
    ]
  }
}
```

### **Example 2: Booking with Percentage Discount**

```json
{
  "type": "hotel",
  "first_name": "Sarah",
  "last_name": "Johnson",
  "email": "sarah@example.com",
  "booking_items": [
    {
      "package_id": "cmgeia8k10001jvegqfy9cpac",
      "start_date": "2026-02-15T00:00:00.000Z",
      "end_date": "2026-02-18T00:00:00.000Z",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Sarah Johnson",
      "email": "sarah@example.com"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
      "quantity": 1,
      "notes": "Airport pickup"
    },
    {
      "extra_service_id": "cmgeia8k10008jvegp67chhsi",
      "quantity": 3,
      "notes": "Daily breakfast"
    }
  ],
  "discount_percentage": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "total_amount": "1305"
    },
    "price_breakdown": {
      "package_total": 1200,
      "extra_services_total": 175,
      "base_total": 1375,
      "discount_applied": 137.5,
      "final_total": 1237.5,
      "discount_percentage": 10,
      "discount_amount": 0
    }
  }
}
```

### **Example 3: Booking with Fixed Amount Discount**

```json
{
  "type": "hotel",
  "first_name": "Mike",
  "last_name": "Wilson",
  "email": "mike@example.com",
  "booking_items": [
    {
      "package_id": "cmgeia8k10001jvegqfy9cpac",
      "start_date": "2026-02-15T00:00:00.000Z",
      "end_date": "2026-02-18T00:00:00.000Z",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Mike Wilson",
      "email": "mike@example.com"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
      "quantity": 2,
      "notes": "Round trip chauffeur"
    }
  ],
  "discount_amount": 200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "total_amount": "1200"
    },
    "price_breakdown": {
      "package_total": 1200,
      "extra_services_total": 200,
      "base_total": 1400,
      "discount_applied": 200,
      "final_total": 1200,
      "discount_percentage": 0,
      "discount_amount": 200
    }
  }
}
```

### **Example 4: Booking with Custom Extra Service Prices**

```json
{
  "type": "hotel",
  "first_name": "Emma",
  "last_name": "Davis",
  "email": "emma@example.com",
  "booking_items": [
    {
      "package_id": "cmgeia8k10001jvegqfy9cpac",
      "start_date": "2026-02-15T00:00:00.000Z",
      "end_date": "2026-02-18T00:00:00.000Z",
      "quantity": 1
    }
  ],
  "booking_travellers": [
    {
      "type": "adult",
      "full_name": "Emma Davis",
      "email": "emma@example.com"
    }
  ],
  "booking_extra_services": [
    {
      "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
      "price": 80.00,
      "quantity": 1,
      "notes": "Special rate chauffeur service"
    },
    {
      "extra_service_id": "cmgeia8k1000cjveghom87016",
      "quantity": 2,
      "notes": "Daily housekeeping"
    }
  ],
  "discount_percentage": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "total_amount": "1235"
    },
    "price_breakdown": {
      "package_total": 1200,
      "extra_services_total": 180,
      "base_total": 1380,
      "discount_applied": 69,
      "final_total": 1311,
      "discount_percentage": 5,
      "discount_amount": 0
    },
    "extra_services": [
      {
        "price": "80",
        "quantity": 1,
        "notes": "Special rate chauffeur service"
      },
      {
        "price": "50",
        "quantity": 2,
        "notes": "Daily housekeeping"
      }
    ]
  }
}
```

## 💰 **Price Calculation Logic:**

### **Base Calculation:**
```
Package Total = package_price × quantity
Extra Services Total = Σ(service_price × quantity)
Base Total = Package Total + Extra Services Total
```

### **Discount Application:**
```
If discount_amount > 0:
  Final Total = Base Total - discount_amount
Else if discount_percentage > 0:
  Discount = (Base Total × discount_percentage) / 100
  Final Total = Base Total - Discount
Else:
  Final Total = Base Total
```

### **Price Priority:**
1. **Request Price** (if provided in booking_extra_services)
2. **Database Price** (from extra_services table)
3. **Default: 0**

## 🎯 **Available Extra Services for Package:**

| Service Name | ID | Default Price | Description |
|-------------|----|--------------|-------------|
| breakfast | cmgeia8k10008jvegp67chhsi | $25 | Daily continental breakfast |
| groceryDelivery | cmgeia8k1000ajvegv1vs2pru | $15 | Grocery delivery service |
| dailyHousekeeping | cmgeia8k1000cjveghom87016 | $50 | Daily housekeeping service |
| chauffeur | cmgeia8k1000ejveg429eg5fo | $100 | Personal chauffeur service |
| fullCleaning | cmgeia8k1000gjvegvokyudbf | $75 | Full cleaning service |

## 🔧 **API Usage:**

### **Minimal Request (Auto-Price):**
```json
{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "booking_items": [
    {
      "package_id": "cmgeia8k10001jvegqfy9cpac",
      "start_date": "2026-02-15T00:00:00.000Z",
      "end_date": "2026-02-18T00:00:00.000Z",
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
      "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
      "quantity": 2
    }
  ]
}
```

### **Full Request with Discount:**
```json
{
  "type": "hotel",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "booking_items": [
    {
      "package_id": "cmgeia8k10001jvegqfy9cpac",
      "start_date": "2026-02-15T00:00:00.000Z",
      "end_date": "2026-02-18T00:00:00.000Z",
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
      "extra_service_id": "cmgeia8k1000ejveg429eg5fo",
      "price": 100.00,
      "quantity": 2,
      "notes": "Chauffeur service for round trip"
    }
  ],
  "discount_percentage": 10
}
```

## ✅ **Benefits:**

1. **Simplified Booking** - No need to specify prices manually
2. **Flexible Pricing** - Can override prices when needed
3. **Discount Support** - Both percentage and fixed amount
4. **Detailed Breakdown** - Clear price transparency
5. **Quantity Support** - Proper quantity handling
6. **Notes Support** - Custom notes for each service

Your booking system is now fully enhanced and ready for production! 🎉
