# 🚀 API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the Warped AI Magic inventory management system.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication
Currently, no authentication is required for API endpoints. Future versions will implement API key authentication.

## Response Format
All API responses follow this standard format:
```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "message": string | null
}
```

---

## 🤖 AI Enhancement Endpoints

### POST /api/ai/enhance-product
Enhance a product using AI with optional market research and pricing analysis.

**Request Body:**
```json
{
  "productId": "string (required)",
  "includeMarketResearch": "boolean (optional, default: true)",
  "includePricing": "boolean (optional, default: true)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id": "string",
      "title": "string",
      "description": "string",
      "enhancedAt": "datetime",
      "enhancementStatus": "enhanced"
    },
    "imageStats": {
      "added": "number",
      "skipped": "number", 
      "errors": "number"
    },
    "marketData": {
      "averagePrice": "number",
      "suggestedPrice": "number",
      "competitorCount": "number"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid product ID or missing required fields
- `404` - Product not found
- `500` - AI service error or internal server error

---

## 📦 Product Management Endpoints

### POST /api/products/lookup
Look up product information by UPC/EAN barcode.

**Request Body:**
```json
{
  "upc": "string (required, 8-14 digits)",
  "sources": ["upcitemdb", "upcdatabase", "amazon"] // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "string",
    "brand": "string",
    "description": "string",
    "images": ["string"],
    "weight": "number",
    "dimensions": {
      "length": "number",
      "width": "number", 
      "height": "number"
    },
    "source": "string"
  }
}
```

### POST /api/products/bulk-import
Import products from CSV file.

**Request Body:**
```json
{
  "csvData": "string (required, CSV format)",
  "format": "cpi | basic" // optional, default: "cpi"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": "number",
    "skipped": "number",
    "errors": ["string"],
    "products": ["Product[]"]
  }
}
```

### GET /api/products/[id]
Get detailed product information by ID.

**Parameters:**
- `id` (string, required) - Product ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "title": "string",
    "description": "string",
    "brand": "string",
    "upc": "string",
    "price": "number",
    "quantity": "number",
    "weight": "number",
    "enhancementStatus": "pending | enhanced | error",
    "images": ["ProductImage[]"],
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### PUT /api/products/[id]
Update product information.

**Request Body:**
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "brand": "string (optional)",
  "price": "number (optional)",
  "quantity": "number (optional)",
  "weight": "number (optional)"
}
```

### DELETE /api/products/[id]
Delete a product and all associated images.

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

## 🖼️ Image Management Endpoints

### POST /api/images/upload
Upload product images.

**Request Body (FormData):**
- `productId` (string, required)
- `files` (File[], required)

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaded": "number",
    "images": ["ProductImage[]"]
  }
}
```

### POST /api/images/fetch-external
Fetch images from external sources for a product.

**Request Body:**
```json
{
  "productId": "string (required)",
  "upc": "string (optional)",
  "sources": ["amazon", "ebay", "upcitemdb"] // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fetched": "number",
    "skipped": "number",
    "errors": "number",
    "images": ["ProductImage[]"]
  }
}
```

### DELETE /api/images/[id]
Delete a specific product image.

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

---

## 📊 Export Endpoints

### GET /api/export/multi-format
Export products in multiple marketplace formats.

**Query Parameters:**
- `productIds` (string[], required) - Array of product IDs
- `formats` (string[], required) - Array of formats: "ebay", "amazon", "walmart"
- `filename` (string, optional) - Custom filename

**Response:**
Returns ZIP file containing CSV files for each requested format.

### GET /api/export/csv
Export products to CSV format.

**Query Parameters:**
- `productIds` (string[], optional) - Specific products to export
- `format` (string, optional) - "cpi" | "basic", default: "cpi"

**Response:**
Returns CSV file download.

---

## 🔍 Search & Filter Endpoints

### GET /api/search/products
Search products with advanced filtering.

**Query Parameters:**
- `q` (string, optional) - Search query
- `hasImages` (boolean, optional) - Filter by image availability
- `enhancementStatus` (string, optional) - "pending" | "enhanced" | "error"
- `priceMin` (number, optional) - Minimum price
- `priceMax` (number, optional) - Maximum price
- `brand` (string, optional) - Filter by brand
- `page` (number, optional) - Page number, default: 1
- `limit` (number, optional) - Items per page, default: 50

**Response:**
```json
{
  "success": true,
  "data": {
    "products": ["Product[]"],
    "pagination": {
      "page": "number",
      "limit": "number", 
      "total": "number",
      "pages": "number"
    },
    "filters": {
      "brands": ["string"],
      "priceRange": {
        "min": "number",
        "max": "number"
      }
    }
  }
}
```

---

## 📈 Analytics Endpoints

### GET /api/analytics/inventory-health
Get overall inventory health metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": "number",
    "enhancedProducts": "number",
    "productsWithImages": "number",
    "averageImagesPerProduct": "number",
    "enhancementScore": "number",
    "recentActivity": {
      "imagesAddedThisWeek": "number",
      "productsEnhancedThisWeek": "number"
    }
  }
}
```

### GET /api/analytics/quality-report
Get data quality analysis for products.

**Response:**
```json
{
  "success": true,
  "data": {
    "missingDescriptions": "number",
    "missingImages": "number",
    "poorTitles": "number",
    "missingWeights": "number",
    "qualityScore": "number",
    "recommendations": ["string"]
  }
}
```

---

## ⚡ Bulk Operations Endpoints

### POST /api/bulk/enhance
Enhance multiple products with AI.

**Request Body:**
```json
{
  "productIds": ["string"] // required
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "total": "number",
    "status": "started"
  }
}
```

### POST /api/bulk/fetch-images
Fetch images for multiple products.

**Request Body:**
```json
{
  "productIds": ["string"] // required
}
```

### GET /api/bulk/status/[jobId]
Check status of bulk operation.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "string",
    "status": "pending | processing | completed | error",
    "progress": {
      "completed": "number",
      "total": "number",
      "percentage": "number"
    },
    "results": {
      "successful": "number",
      "failed": "number",
      "errors": ["string"]
    }
  }
}
```

---

## 🛠️ Utility Endpoints

### POST /api/utils/validate-upc
Validate UPC/EAN barcode format.

**Request Body:**
```json
{
  "upc": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": "boolean",
    "format": "UPC-A | EAN-13 | EAN-8",
    "checkDigit": "boolean"
  }
}
```

### GET /api/utils/health
System health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "externalAPIs": {
      "gemini": "available",
      "upcitemdb": "available",
      "amazon": "available"
    },
    "uptime": "string"
  }
}
```

---

## 🔧 Configuration Endpoints

### GET /api/config/external-apis
Get status of external API configurations.

**Response:**
```json
{
  "success": true,
  "data": {
    "gemini": {
      "configured": "boolean",
      "model": "string"
    },
    "upcitemdb": {
      "configured": "boolean",
      "rateLimit": "number"
    },
    "amazon": {
      "configured": "boolean",
      "region": "string"
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid parameters or missing required fields |
| `401` | Unauthorized - API key required (future implementation) |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists or operation conflict |
| `422` | Unprocessable Entity - Validation errors |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error - Server or external API error |
| `503` | Service Unavailable - External service temporarily unavailable |

## Rate Limits

- **General API calls**: 1000 requests per hour per IP
- **AI Enhancement**: 100 requests per hour per IP
- **Image Upload**: 50 requests per hour per IP
- **Bulk Operations**: 10 concurrent jobs per IP

## SDK & Libraries

### JavaScript/TypeScript
```typescript
import { WarpedAIClient } from '@warped-ai/client';

const client = new WarpedAIClient({
  baseURL: 'https://your-domain.com/api',
  apiKey: 'your-api-key' // future implementation
});

// Enhance a product
const result = await client.products.enhance('product-id');
```

### cURL Examples

**Enhance Product:**
```bash
curl -X POST \
  http://localhost:3000/api/ai/enhance-product \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": "product-123",
    "includeMarketResearch": true
  }'
```

**Search Products:**
```bash
curl -X GET \
  "http://localhost:3000/api/search/products?q=electronics&hasImages=true&limit=20"
```

## Support

For API support and questions:
- **Documentation**: `/docs` folder in repository
- **Issues**: GitHub Issues for bug reports
- **Feature Requests**: GitHub Discussions

---

*Last updated: 2025-08-24*