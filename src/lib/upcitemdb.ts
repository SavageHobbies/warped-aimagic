interface UPCItemResponse {
  code: string
  total: number
  offset: number
  items?: {
    upc: string
    title: string
    description?: string
    brand?: string
    model?: string
    color?: string
    size?: string
    dimension?: string
    weight?: string
    category?: string
    currency?: string
    lowest_recorded_price?: string
    highest_recorded_price?: string
    ean?: string
    gtin?: string
    elid?: string
    images?: string[]
    offers?: {
      merchant: string
      domain?: string
      title?: string
      currency?: string
      list_price?: string
      price?: string
      shipping?: string
      condition?: string
      availability?: string
      link?: string
    }[]
  }[]
}

interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  current: number
  lastRequestTime: number
}

class UPCItemDBService {
  private baseUrl = 'https://api.upcitemdb.com/prod/trial/lookup'
  private searchUrl = 'https://api.upcitemdb.com/prod/trial/search'
  private rateLimit: RateLimitInfo = {
    limit: 100,
    remaining: 100,
    reset: 0,
    current: 0,
    lastRequestTime: 0
  }
  private searchCount: number = 0
  private readonly DAILY_SEARCH_LIMIT = 20

  async lookupProduct(upc: string): Promise<UPCItemResponse> {
    // Rate limiting check
    const now = Date.now()
    const timeSinceLastRequest = now - this.rateLimit.lastRequestTime
    
    // Enforce minimum 10 second delay between requests (burst limit)
    if (timeSinceLastRequest < 10000) {
      const waitTime = 10000 - timeSinceLastRequest
      await this.sleep(waitTime)
    }

    // Check daily rate limit
    if (this.rateLimit.remaining <= 0) {
      const waitTime = Math.max(0, this.rateLimit.reset - Math.floor(Date.now() / 1000))
      if (waitTime > 0) {
        throw new Error(`Daily rate limit exceeded. Reset in ${waitTime} seconds.`)
      }
    }

    const url = `${this.baseUrl}?upc=${encodeURIComponent(upc)}`
    
    console.log(`Sending request to UPCItemDB API for UPC: ${upc}`)
    
    this.rateLimit.lastRequestTime = Date.now()

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Update rate limit info from headers
    this.updateRateLimitInfo(response.headers)

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter) : 60
      throw new Error(`Rate limit exceeded. Retry after ${waitTime} seconds.`)
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`)
    }

    const data: UPCItemResponse = await response.json()
    
    console.log(`API Response:`, data)
    
    return data
  }

  /**
   * Search for products by name/title to find UPC codes
   * Limited to 20 searches per day by API
   */
  async searchProductByName(productName: string, brand?: string): Promise<UPCItemResponse> {
    // Check search limit (20 per day)
    if (this.searchCount >= this.DAILY_SEARCH_LIMIT) {
      throw new Error(`Daily search limit exceeded (${this.DAILY_SEARCH_LIMIT} searches per day)`)
    }

    // Rate limiting check
    const now = Date.now()
    const timeSinceLastRequest = now - this.rateLimit.lastRequestTime
    
    // Enforce minimum 10 second delay between requests
    if (timeSinceLastRequest < 10000) {
      const waitTime = 10000 - timeSinceLastRequest
      await this.sleep(waitTime)
    }

    // Build search query - combine product name and brand for better results
    let searchQuery = productName.trim()
    if (brand && brand.trim()) {
      searchQuery = `${brand.trim()} ${searchQuery}`
    }

    const url = `${this.searchUrl}?s=${encodeURIComponent(searchQuery)}`
    
    console.log(`🔍 Searching UPCItemDB for product: "${searchQuery}" (Search ${this.searchCount + 1}/${this.DAILY_SEARCH_LIMIT})`)
    
    this.rateLimit.lastRequestTime = Date.now()
    this.searchCount++

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Update rate limit info from headers
    this.updateRateLimitInfo(response.headers)

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter) : 60
      throw new Error(`Rate limit exceeded. Retry after ${waitTime} seconds.`)
    }

    if (!response.ok) {
      throw new Error(`Search API request failed with status ${response.status}: ${response.statusText}`)
    }

    const data: UPCItemResponse = await response.json()
    
    console.log(`🔍 Search Results for "${searchQuery}":`, {
      total: data.total,
      found: data.items?.length || 0,
      searchesRemaining: this.DAILY_SEARCH_LIMIT - this.searchCount
    })
    
    return data
  }

  private updateRateLimitInfo(headers: Headers) {
    const limit = headers.get('x-ratelimit-limit')
    const remaining = headers.get('x-ratelimit-remaining')
    const reset = headers.get('x-ratelimit-reset')
    const current = headers.get('x-ratelimit-current')

    if (limit) this.rateLimit.limit = parseInt(limit)
    if (remaining) this.rateLimit.remaining = parseInt(remaining)
    if (reset) this.rateLimit.reset = parseInt(reset)
    if (current) this.rateLimit.current = parseInt(current)

    console.log('Rate limit info updated:', this.rateLimit)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimit }
  }

  getSearchCount(): { used: number; remaining: number; limit: number } {
    return {
      used: this.searchCount,
      remaining: this.DAILY_SEARCH_LIMIT - this.searchCount,
      limit: this.DAILY_SEARCH_LIMIT
    }
  }

  resetSearchCount(): void {
    this.searchCount = 0
    console.log('🔄 Search count reset for new day')
  }

  // Mock data for development/testing
  generateMockResponse(upc: string): UPCItemResponse {
    return {
      code: 'OK',
      total: 1,
      offset: 0,
      items: [{
        upc: upc,
        title: `Mock Product for UPC ${upc}`,
        description: 'This is a mock product description for development and testing purposes.',
        brand: 'Mock Brand',
        model: 'Mock Model',
        color: 'Multi-Color',
        category: 'Electronics > Consumer Electronics',
        currency: 'USD',
        lowest_recorded_price: '19.99',
        highest_recorded_price: '29.99',
        images: [
          'https://via.placeholder.com/300x300/4f46e5/ffffff?text=Mock+Product',
          'https://via.placeholder.com/300x300/7c3aed/ffffff?text=Mock+Product+2'
        ],
        offers: [
          {
            merchant: 'Mock Store 1',
            domain: 'mockstore1.com',
            title: `Mock Product for UPC ${upc}`,
            currency: 'USD',
            price: '24.99',
            list_price: '29.99',
            condition: 'New',
            availability: 'In Stock'
          },
          {
            merchant: 'Mock Store 2',
            domain: 'mockstore2.com',
            title: `Mock Product for UPC ${upc}`,
            currency: 'USD',
            price: '22.99',
            list_price: '27.99',
            condition: 'New',
            availability: 'In Stock'
          }
        ]
      }]
    }
  }
}

export const upcItemDB = new UPCItemDBService()
export type { UPCItemResponse, RateLimitInfo }
