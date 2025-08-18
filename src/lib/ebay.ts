import axios from 'axios'

interface EbayCategoryAspect {
  aspectConstraint: {
    aspectDataType: string
    aspectEnabledForVariations: boolean
    aspectUsage: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'
    expectedRequiredByDate?: string
  }
  aspectValues?: {
    localizedValue: string
    value: string
    valueConstraints?: {
      applicableForLocalizedAspectName?: string
      applicableForLocalizedAspectValue?: string
    }
  }[]
  localizedAspectName: string
}

interface EbayCategory {
  categoryId: string
  categoryName: string
  categoryTreeId: string
  parentCategoryId?: string
  leafCategory: boolean
  level: number
}

interface EbayCategoryTree {
  categoryTreeId: string
  categoryTreeVersion: string
  rootCategoryNode: {
    categoryId: string
    categoryName: string
    childCategoryTreeNodes?: EbayCategory[]
  }
}

interface EbayItemSummary {
  itemId: string
  title: string
  price?: {
    value: string
    currency: string
  }
  buyingOptions?: string[]
  categories?: {
    categoryId: string
    categoryName: string
  }[]
  condition?: string
  thumbnailImages?: {
    imageUrl: string
  }[]
  itemWebUrl?: string
}

interface EbaySearchResult {
  total: number
  limit: number
  offset: number
  itemSummaries?: EbayItemSummary[]
}

class EbayService {
  private appId: string
  private devId: string
  private certId: string
  private environment: 'sandbox' | 'production'
  private accessToken?: string
  private tokenExpiry?: Date

  constructor() {
    this.appId = process.env.EBAY_APP_ID || ''
    this.devId = process.env.EBAY_DEV_ID || ''
    this.certId = process.env.EBAY_CERT_ID || ''
    this.environment = (process.env.EBAY_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    
    if (!this.appId || !this.devId || !this.certId) {
      console.warn('eBay API credentials not configured. eBay features will be limited.')
    }
  }

  private getBaseUrl(): string {
    return this.environment === 'production' 
      ? 'https://api.ebay.com'
      : 'https://api.sandbox.ebay.com'
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    try {
      const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64')
      
      const response = await axios.post(
        `${this.getBaseUrl()}/identity/v1/oauth2/token`,
        'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      const accessToken = response.data.access_token
      if (!accessToken) {
        throw new Error('No access token received from eBay')
      }
      
      this.accessToken = accessToken
      const expiresIn = response.data.expires_in // in seconds
      this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000))

      return accessToken
    } catch (error) {
      console.error('Failed to get eBay access token:', error)
      throw new Error('eBay authentication failed')
    }
  }

  async getCategoryTree(marketplace: string = 'EBAY_US'): Promise<EbayCategoryTree | null> {
    try {
      const token = await this.getAccessToken()
      
      const response = await axios.get(
        `${this.getBaseUrl()}/commerce/taxonomy/v1/category_tree/${marketplace}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to get eBay category tree:', error)
      return null
    }
  }

  async getCategoryAspects(categoryId: string, marketplace: string = 'EBAY_US'): Promise<EbayCategoryAspect[] | null> {
    try {
      const token = await this.getAccessToken()
      
      const response = await axios.get(
        `${this.getBaseUrl()}/commerce/taxonomy/v1/category_tree/${marketplace}/get_item_aspects_for_category`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            category_id: categoryId
          }
        }
      )

      return response.data.aspects || []
    } catch (error) {
      console.error(`Failed to get eBay category aspects for category ${categoryId}:`, error)
      return null
    }
  }

  async searchByKeywords(keywords: string, categoryId?: string, limit: number = 50): Promise<EbaySearchResult | null> {
    try {
      const token = await this.getAccessToken()
      
      const params: { [key: string]: string | number } = {
        q: keywords,
        limit: limit
      }

      if (categoryId) {
        params.category_ids = categoryId
      }

      const response = await axios.get(
        `${this.getBaseUrl()}/buy/browse/v1/item_summary/search`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params
        }
      )

      return response.data
    } catch (error) {
      console.error('Failed to search eBay items:', error)
      return null
    }
  }

  async findBestCategory(productTitle: string, brand?: string): Promise<{ categoryId: string; categoryName: string; confidence: number } | null> {
    try {
      const searchQuery = brand ? `${productTitle} ${brand}` : productTitle
      const searchResults = await this.searchByKeywords(searchQuery, undefined, 20)

      if (!searchResults?.itemSummaries?.length) {
        return null
      }

      // Analyze categories from search results
      const categoryCount: { [key: string]: { name: string; count: number } } = {}
      
      searchResults.itemSummaries.forEach(item => {
        if (item.categories) {
          item.categories.forEach(category => {
            const key = category.categoryId
            if (categoryCount[key]) {
              categoryCount[key].count++
            } else {
              categoryCount[key] = {
                name: category.categoryName,
                count: 1
              }
            }
          })
        }
      })

      // Find most common category
      let bestCategory = null
      let maxCount = 0
      
      for (const [categoryId, data] of Object.entries(categoryCount)) {
        if (data.count > maxCount) {
          maxCount = data.count
          bestCategory = {
            categoryId,
            categoryName: data.name,
            confidence: data.count / searchResults.itemSummaries.length
          }
        }
      }

      return bestCategory
    } catch (error) {
      console.error('Failed to find best eBay category:', error)
      return null
    }
  }

  async getCompetitivePricing(keywords: string, categoryId?: string): Promise<{
    averagePrice?: number
    lowestPrice?: number
    highestPrice?: number
    currency: string
    sampleSize: number
  } | null> {
    try {
      const searchResults = await this.searchByKeywords(keywords, categoryId, 100)
      
      if (!searchResults?.itemSummaries?.length) {
        return null
      }

      const prices: number[] = []
      let currency = 'USD'

      searchResults.itemSummaries.forEach(item => {
        if (item.price?.value && !isNaN(parseFloat(item.price.value))) {
          prices.push(parseFloat(item.price.value))
          currency = item.price.currency || currency
        }
      })

      if (prices.length === 0) {
        return null
      }

      const sortedPrices = prices.sort((a, b) => a - b)
      
      return {
        averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        lowestPrice: sortedPrices[0],
        highestPrice: sortedPrices[sortedPrices.length - 1],
        currency,
        sampleSize: prices.length
      }
    } catch (error) {
      console.error('Failed to get competitive pricing:', error)
      return null
    }
  }

  async getItemSpecificsFromSimilarProducts(keywords: string, categoryId?: string): Promise<{ [key: string]: string[] } | null> {
    try {
      const searchResults = await this.searchByKeywords(keywords, categoryId, 50)
      
      if (!searchResults?.itemSummaries?.length) {
        return null
      }

      // This would require additional API calls to get item details
      // For now, we'll extract what we can from titles and available data
      const extractedAttributes: { [key: string]: Set<string> } = {}
      
      searchResults.itemSummaries.forEach(item => {
        const title = item.title?.toLowerCase() || ''
        
        // Extract common attributes from titles
        if (title.includes('new')) extractedAttributes['Condition'] = (extractedAttributes['Condition'] || new Set()).add('New')
        if (title.includes('used')) extractedAttributes['Condition'] = (extractedAttributes['Condition'] || new Set()).add('Used')
        
        // Extract brand from title (this is basic pattern matching)
        const brandMatch = title.match(/\b(nike|adidas|apple|samsung|funko|disney|marvel|dc)\b/i)
        if (brandMatch) {
          extractedAttributes['Brand'] = (extractedAttributes['Brand'] || new Set()).add(brandMatch[1])
        }
      })

      // Convert Sets to Arrays
      const result: { [key: string]: string[] } = {}
      for (const [key, valueSet] of Object.entries(extractedAttributes)) {
        result[key] = Array.from(valueSet)
      }

      return result
    } catch (error) {
      console.error('Failed to extract item specifics:', error)
      return null
    }
  }

  isConfigured(): boolean {
    return !!(this.appId && this.devId && this.certId)
  }

  getEnvironment(): string {
    return this.environment
  }
}

export const ebayService = new EbayService()
export type { EbayCategoryAspect, EbayCategory, EbayItemSummary, EbaySearchResult }
