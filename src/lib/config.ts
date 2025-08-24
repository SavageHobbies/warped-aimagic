/**
 * Configuration utilities for the application
 * Provides dynamic API base URLs and other configuration values
 */

/**
 * Get the base URL for internal API calls
 * Uses environment variables or Next.js headers to determine the correct URL
 */
export function getApiBaseUrl(request?: Request): string {
  // In production, we can use relative URLs since all API calls are internal
  if (process.env.NODE_ENV === 'production') {
    return ''
  }

  // Check for explicit API_BASE_URL environment variable
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL
  }

  // Try to extract from request headers if available
  if (request?.headers) {
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    
    if (host) {
      return `${protocol}://${host}`
    }
  }

  // Try to get from environment variables used by Next.js
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Default fallback for development
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}`
}

/**
 * Get configuration for external API endpoints
 */
export function getExternalApiConfig() {
  return {
    upcItemDb: {
      baseUrl: 'https://api.upcitemdb.com/prod/trial/lookup',
      apiKey: process.env.UPCITEMDB_API_KEY
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      fallbackModel: process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash'
    }
  }
}

/**
 * Get the current port from environment or default
 */
export function getPort(): number {
  return parseInt(process.env.PORT || '3000', 10)
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}