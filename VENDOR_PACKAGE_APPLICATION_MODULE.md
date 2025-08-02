# Application Vendor Package Module

This module provides public access to vendor packages in the travel agency backend. It allows users to search, view, and browse vendor packages without authentication.

## Features

### 🔍 **Search & Filter**
- Search packages by name, description, location
- Filter by price range, capacity, dates
- Sort by price, rating, creation date
- Pagination support

### 📦 **Package Details**
- Complete package information
- Room types and availability
- Vendor information
- Reviews and ratings
- Trip plans and images

### 👤 **Vendor Packages**
- Browse packages by specific vendor
- Featured packages listing
- Vendor profile information

## API Endpoints

### 1. Search Vendor Packages
```
GET /application/vendor-package
```

**Query Parameters:**
- `search` - Search term for package name/description
- `min_price` / `max_price` - Price range filter
- `adults` / `children` / `infants` - Guest count
- `rooms` - Number of rooms needed
- `start_date` / `end_date` - Date range (YYYY-MM-DD)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 50)
- `sort_by` - Sort order: `price_asc`, `price_desc`, `rating_desc`, `created_at_desc`

**Response:**
```json
{
  "success": true,
  "data": {
    "packages": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 2. Get Package Details
```
GET /application/vendor-package/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "package_id",
    "name": "Luxury Villa",
    "description": "Beautiful villa with ocean view",
    "price": 500.00,
    "user": {
      "id": "vendor_id",
      "name": "John Doe",
      "display_name": "John's Properties",
      "avatar": "avatar_url",
      "type": "vendor"
    },
    "package_room_types": [...],
    "package_availabilities": [...],
    "package_files": [...],
    "reviews": [...],
    "_count": {
      "reviews": 15
    }
  }
}
```

### 3. Get Vendor Packages
```
GET /application/vendor-package/vendor/:vendorId
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### 4. Get Featured Packages
```
GET /application/vendor-package/featured/list
```

**Query Parameters:**
- `limit` - Number of packages to return (default: 10)

## Data Models

### Package Structure
```typescript
interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration?: number;
  duration_type?: string;
  min_capacity?: number;
  max_capacity?: number;
  type?: string;
  country?: string;
  city?: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  size_sqm?: number;
  amenities?: any;
  house_rules?: any;
  check_in?: any;
  check_out?: string;
  booking_method?: string;
  commission_rate?: number;
  user: VendorInfo;
  package_room_types: RoomType[];
  package_availabilities: Availability[];
  package_files: PackageFile[];
  reviews: Review[];
  _count: { reviews: number };
}
```

### Room Type Structure
```typescript
interface RoomType {
  id: string;
  name: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
  size_sqm?: number;
  price: number;
  currency?: string;
  is_default?: boolean;
  is_available?: boolean;
  room_photos?: any;
}
```

### Availability Structure
```typescript
interface Availability {
  id: string;
  date: Date;
  status: string;
  rates?: any;
  restrictions?: any;
}
```

## Usage Examples

### Search for Luxury Packages
```javascript
const response = await axios.get('/application/vendor-package', {
  params: {
    search: 'luxury',
    min_price: 200,
    max_price: 1000,
    adults: 2,
    children: 1,
    sort_by: 'price_asc'
  }
});
```

### Get Package Details
```javascript
const response = await axios.get('/application/vendor-package/package_id');
```

### Browse Vendor's Packages
```javascript
const response = await axios.get('/application/vendor-package/vendor/vendor_id', {
  params: { page: 1, limit: 10 }
});
```

### Get Featured Packages
```javascript
const response = await axios.get('/application/vendor-package/featured/list', {
  params: { limit: 5 }
});
```

## Testing

Run the test script to verify the API endpoints:

```bash
node test-application-vendor-package.js
```

## Security & Access Control

- **Public Access**: All endpoints are publicly accessible
- **Data Filtering**: Only approved and available packages are returned
- **Rate Limiting**: Standard rate limiting applies
- **Input Validation**: All query parameters are validated

## Dependencies

- `@nestjs/common` - Core NestJS functionality
- `@nestjs/swagger` - API documentation
- `@prisma/client` - Database operations
- `class-validator` - Input validation
- `class-transformer` - Data transformation

## File Structure

```
src/modules/application/vendor-package/
├── vendor-package.module.ts          # Module definition
├── vendor-package.controller.ts      # API endpoints
├── vendor-package.service.ts         # Business logic
└── dto/
    └── vendor-package-response.dto.ts # Response DTOs
```

## Integration

The module is automatically included in the `ApplicationModule` and provides endpoints under the `/application/vendor-package` route prefix.

## Future Enhancements

- [ ] Advanced filtering (amenities, location radius)
- [ ] Package recommendations
- [ ] Wishlist functionality
- [ ] Package comparison
- [ ] Real-time availability updates
- [ ] Multi-language support 