# Dynamic Configuration Guide

This application uses dynamic configuration to eliminate hard-coded ports and URLs, making it flexible for different deployment environments.

## Configuration Files

### Environment Variables

The following environment variables control the application's network configuration:

```bash
# Port configuration (default: 3000)
PORT=3000

# Host configuration (default: localhost)
HOST=localhost

# Optional: Override API base URL for internal calls
API_BASE_URL=http://localhost:3000

# Development/Production environment
NODE_ENV=development
```

### Configuration Utility

The application uses a centralized configuration utility (`src/lib/config.ts`) that provides:

- **`getApiBaseUrl(request?)`**: Dynamically determines the base URL for internal API calls
- **`getPort()`**: Gets the current port from environment variables
- **`getExternalApiConfig()`**: Provides configuration for external APIs
- **`isDevelopment()`** / **`isProduction()`**: Environment checks

## Dynamic URL Resolution

Internal API calls automatically use the correct base URL based on:

1. **Production**: Uses relative URLs (empty base URL)
2. **Explicit override**: Uses `API_BASE_URL` environment variable if set
3. **Request headers**: Extracts from incoming request headers when available
4. **Environment detection**: Uses `VERCEL_URL` for Vercel deployments
5. **Development fallback**: Uses `http://localhost:${PORT}`

## Examples

### Development Server
```bash
# Default (port 3000)
npm run dev

# Custom port
PORT=8080 npm run dev

# Custom host and port
HOST=0.0.0.0 PORT=8080 npm run dev
```

### Testing Scripts
```bash
# Use default configuration
node test-csv-import.js

# Use custom port
PORT=8080 node test-csv-import.js

# Use custom API base URL
API_BASE_URL=http://localhost:8080 node test-csv-import.js
```

### Production Deployment
```bash
# Vercel (automatically detected)
VERCEL_URL=myapp.vercel.app

# Custom domain
API_BASE_URL=https://myapp.example.com
```

## Benefits

1. **No Hard-coded URLs**: All ports and hosts are configurable
2. **Environment Flexibility**: Works in development, staging, and production
3. **Container Ready**: Easily configurable for Docker deployments
4. **Test Friendly**: Test scripts automatically adapt to configuration
5. **Deployment Agnostic**: Works with any hosting platform

## Migration

If you have any hard-coded URLs in your code:

```typescript
// ❌ Hard-coded (old way)
const baseUrl = 'http://localhost:3000'
fetch(`${baseUrl}/api/products`)

// ✅ Dynamic (new way)
import { getApiBaseUrl } from '@/lib/config'

const baseUrl = getApiBaseUrl(request)
fetch(`${baseUrl}/api/products`)
```

For frontend components, use relative URLs:

```typescript
// ✅ Frontend API calls (relative URLs)
fetch('/api/products')
```