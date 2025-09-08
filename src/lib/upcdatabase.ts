interface UPCDatabaseResponse {
  success: boolean
  product?: {
    upc: string
    title: string
    description?: string
    brand?: string
    model?: string
    color?: string
    size?: string
    weight?: string
    category?: string
    images?: string[]
    offers?: {
      merchant: string
      title?: string
      price?: string
      currency?: string
      condition?: string
      availability?: string
      link?: string
    }[]
  }
  error?: string
}

interface SearchResponse {
  success: boolean
  products?: {
    upc: string
    title: string
    description?: string
    brand?: string
    category?: string
    image?: string
  }[]
  error?: string
}

interface UsageInfo {
  lookups: { used: number; remaining: number; limit: number }
  searches: { used: number; remaining: number; limit: number }
  currency: { used: number; remaining: number; limit: number }
}

class UPCDatabaseService {
  private baseUrl = 'https://api.upcdatabase.org'
  private apiKey: string
  private usageTracking: UsageInfo = {
    lookups: { used: 0, remaining: 100, limit: 100 },
    searches: { used: 0, remaining: 25, limit: 25 },
    currency: { used: 0, remaining: 25, limit: 25 }
  }

  constructor() {
    this.apiKey = process.env.UPC_DATABASE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('UPCDatabase.org API key not configured')
    } else {
      console.log('UPCDatabase.org Service: Initialized successfully')
    }
  }

  /**
   * Lookup product by UPC code
   */
  async lookupByUPC(upc: string): Promise<UPCDatabaseResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' }
    }

    if (this.usageTracking.lookups.remaining <= 0) {
      return { success: false, error: 'Daily lookup limit exceeded' }
    }

    try {
      const url = `${this.baseUrl}/product/${upc}`
      
      console.log(`📡 UPCDatabase.org lookup for UPC: ${upc}`)
      console.log(`📊 Lookups remaining: ${this.usageTracking.lookups.remaining}/${this.usageTracking.lookups.limit}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ key: this.apiKey })
      })

      // Update usage tracking
      this.usageTracking.lookups.used++
      this.usageTracking.lookups.remaining--

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Product not found' }
        }
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      console.log(`✅ UPCDatabase.org lookup successful for ${upc}`)
      console.log(`📊 Updated usage - Lookups: ${this.usageTracking.lookups.used}/${this.usageTracking.lookups.limit}`)

      return {
        success: true,
        product: {
          upc: data.upc || upc,
          title: data.title || data.name || 'Unknown Product',
          description: data.description,
          brand: data.brand || data.manufacturer,
          model: data.model,
          color: data.color,
          size: data.size,
          weight: data.weight,
          category: data.category,
          images: data.images ? [data.images].flat() : [],
          offers: data.offers || []
        }
      }
    } catch (error) {
      console.error('UPCDatabase.org lookup error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Search products by name/title
   */
  async searchByName(productName: string, brand?: string): Promise<SearchResponse> {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' }
    }

    if (this.usageTracking.searches.remaining <= 0) {
      return { success: false, error: 'Daily search limit exceeded' }
    }

    try {
      // Build search query
      let searchQuery = productName.trim()
      if (brand && brand.trim()) {
        searchQuery = `${brand.trim()} ${searchQuery}`
      }

      const url = `${this.baseUrl}/search/${encodeURIComponent(searchQuery)}/${this.apiKey}/1`
      
      console.log(`🔍 UPCDatabase.org search for: "${searchQuery}"`)
      console.log(`📊 Searches remaining: ${this.usageTracking.searches.remaining}/${this.usageTracking.searches.limit}`)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Update usage tracking
      this.usageTracking.searches.used++
      this.usageTracking.searches.remaining--

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'No products found' }
        }
        throw new Error(`Search API request failed with status ${response.status}`)
      }

      const data = await response.json()
      
      const products = Array.isArray(data.products) 
        ? data.products.map((product: {
            upc?: string
            title?: string
            name?: string
            description?: string
            brand?: string
            manufacturer?: string
            category?: string
            image?: string
            images?: string[]
          }) => ({
            upc: product.upc,
            title: product.title || product.name || 'Unknown Product',
            description: product.description,
            brand: product.brand || product.manufacturer,
            category: product.category,
            image: product.image || (product.images && product.images[0])
          }))
        : []

      console.log(`🔍 UPCDatabase.org search results for "${searchQuery}":`, {
        found: products.length,
        searchesRemaining: this.usageTracking.searches.remaining
      })

      return {
        success: true,
        products
      }
    } catch (error) {
      console.error('UPCDatabase.org search error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get current usage statistics
   */
  getUsageInfo(): UsageInfo {
    return { ...this.usageTracking }
  }

  /**
   * Reset daily counters (for new day)
   */
  resetDailyCounters(): void {
    this.usageTracking.lookups.used = 0
    this.usageTracking.lookups.remaining = this.usageTracking.lookups.limit
    this.usageTracking.searches.used = 0
    this.usageTracking.searches.remaining = this.usageTracking.searches.limit
    this.usageTracking.currency.used = 0
    this.usageTracking.currency.remaining = this.usageTracking.currency.limit
    console.log('🔄 UPCDatabase.org daily counters reset')
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }
}

export const upcDatabase = new UPCDatabaseService()
export type { UPCDatabaseResponse, SearchResponse, UsageInfo }