# 📄 Pagination Guide for Packages API

## 🎯 **API Endpoint**
```
GET /api/application/packages
```

## 📋 **Pagination Parameters**

| Parameter | Type | Default | Description | Validation |
|-----------|------|---------|-------------|------------|
| `page` | number | 1 | Page number to retrieve | Must be > 0 |
| `limit` | number | 10 | Number of items per page | Must be 1-100 |
| `type` | string | - | Filter by package type | tour, apartment, etc. |
| `q` | string | - | Search query | Package name/description |

## 🔧 **Usage Examples**

### 1. **Basic Pagination**
```bash
# Get first page (default: 10 items)
GET /api/application/packages

# Get specific page with custom limit
GET /api/application/packages?page=2&limit=5

# Get all items (max limit: 100)
GET /api/application/packages?limit=100
```

### 2. **With Type Filter**
```bash
# Get tour packages (page 1, limit 10)
GET /api/application/packages?type=tour

# Get apartment packages (page 2, limit 5)
GET /api/application/packages?type=apartment&page=2&limit=5
```

### 3. **With Search Query**
```bash
# Search with pagination
GET /api/application/packages?q=beach&page=1&limit=5
```

## 📊 **Response Format**

```json
{
  "success": true,
  "meta": {
    "total": 41,
    "page": 2,
    "limit": 5,
    "totalPages": 9,
    "hasNextPage": true,
    "hasPrevPage": true,
    "nextPage": 3,
    "prevPage": 1,
    "showing": {
      "from": 6,
      "to": 10
    }
  },
  "data": [
    {
      "id": "cmgngxy2q0001tz5c03fl3l1u",
      "name": "Ocean View Test",
      "type": "tour",
      "price": "1200",
      "rating_summary": {
        "averageRating": 4.5,
        "totalReviews": 10,
        "ratingDistribution": { "1": 0, "2": 0, "3": 1, "4": 2, "5": 7 }
      }
    }
  ]
}
```

## 📈 **Meta Object Explanation**

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total number of packages matching filters |
| `page` | number | Current page number |
| `limit` | number | Items per page |
| `totalPages` | number | Total number of pages |
| `hasNextPage` | boolean | Whether next page exists |
| `hasPrevPage` | boolean | Whether previous page exists |
| `nextPage` | number\|null | Next page number (null if no next page) |
| `prevPage` | number\|null | Previous page number (null if no prev page) |
| `showing.from` | number | First item number on current page |
| `showing.to` | number | Last item number on current page |

## 🚨 **Error Handling**

### Invalid Parameters
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "errors": {
    "page": ["page must be greater than 0"],
    "limit": ["limit must be between 1 and 100"]
  }
}
```

### Empty Results
```json
{
  "success": true,
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false,
    "nextPage": null,
    "prevPage": null,
    "showing": {
      "from": 0,
      "to": 0
    }
  },
  "data": []
}
```

## 💡 **Best Practices**

### 1. **Frontend Implementation**
```javascript
// Example pagination component
const [currentPage, setCurrentPage] = useState(1);
const [limit, setLimit] = useState(10);
const [packages, setPackages] = useState([]);
const [meta, setMeta] = useState({});

const fetchPackages = async (page, limit, filters = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters
  });
  
  const response = await fetch(`/api/application/packages?${params}`);
  const data = await response.json();
  
  setPackages(data.data);
  setMeta(data.meta);
};

// Usage
fetchPackages(currentPage, limit, { type: 'tour' });
```

### 2. **Pagination Navigation**
```javascript
// Next page
if (meta.hasNextPage) {
  fetchPackages(meta.nextPage, limit, filters);
}

// Previous page
if (meta.hasPrevPage) {
  fetchPackages(meta.prevPage, limit, filters);
}

// Jump to page
const goToPage = (page) => {
  if (page >= 1 && page <= meta.totalPages) {
    fetchPackages(page, limit, filters);
  }
};
```

### 3. **Performance Optimization**
- Use appropriate `limit` values (10-20 for lists, 50-100 for admin)
- Implement caching for frequently accessed pages
- Use `type` filter to reduce data transfer
- Consider implementing infinite scroll for mobile

## 🧪 **Test URLs**

```bash
# Test basic pagination
curl "http://localhost:4000/api/application/packages?page=1&limit=5"

# Test with type filter
curl "http://localhost:4000/api/application/packages?type=tour&page=2&limit=3"

# Test search with pagination
curl "http://localhost:4000/api/application/packages?q=ocean&page=1&limit=10"

# Test invalid parameters
curl "http://localhost:4000/api/application/packages?page=0&limit=-5"
```

## ✅ **Features Implemented**

- ✅ **Page-based pagination** with skip/take
- ✅ **Comprehensive metadata** (total, pages, navigation)
- ✅ **Input validation** (page > 0, limit 1-100)
- ✅ **Filter compatibility** (works with type, search, etc.)
- ✅ **Error handling** for invalid parameters
- ✅ **Empty result handling** for large page numbers
- ✅ **Performance optimized** with proper indexing

## 🚀 **Ready to Use!**

Your pagination is now fully functional and ready for production use!
