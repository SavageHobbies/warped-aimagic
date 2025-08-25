// BaseLinker API Client
import axios, { AxiosInstance } from 'axios'

export interface BaseLinkerConfig {
  apiToken: string
  endpoint?: string
}

export interface BaseLinkerProduct {
  product_id?: string
  ean?: string
  sku?: string
  name: string
  description?: string
  price: number
  quantity: number
  category_id?: number
  weight?: number
  dimension_w?: number
  dimension_h?: number
  dimension_d?: number
  images?: string[]
  features?: Record<string, string>
}

export interface BaseLinkerResponse<T = unknown> {
  status: 'SUCCESS' | 'ERROR'
  error_code?: string
  error_message?: string
  data?: T
}

// Input product interface for conversion
export interface InputProduct {
  id?: string
  upc?: string | null
  ean?: string | null
  sku?: string | null
  title?: string | null
  description?: string | null
  price?: number | null
  lowestRecordedPrice?: number | null
  quantity?: number | null
  weight?: number | null
  dimensions?: unknown | null
  brand?: string | null
  model?: string | null
  color?: string | null
  size?: string | null
  condition?: string | null
  images?: Array<{ originalUrl?: string | null; url?: string | null }>
}

// Output product interface for conversion
export interface OutputProduct {
  title?: string
  description?: string
  upc?: string
  sku?: string
  price?: number
  quantity?: number
  weight?: number
  dimensions?: {
    width: number
    height: number
    depth: number
  } | null
  brand?: string
  model?: string
  color?: string
  size?: string
  condition?: string
  images?: Array<{ originalUrl: string }>
}

export class BaseLinkerClient {
  private client: AxiosInstance
  private apiToken: string

  constructor(config: BaseLinkerConfig) {
    this.apiToken = config.apiToken
    
    this.client = axios.create({
      baseURL: config.endpoint || 'https://api.baselinker.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })
  }

  private async makeRequest<T = unknown>(
    method: string, 
    parameters: Record<string, unknown> = {}
  ): Promise<BaseLinkerResponse<T>> {
    try {
      const formData = new URLSearchParams()
      formData.append('token', this.apiToken)
      formData.append('method', method)
      
      // Add parameters
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        }
      })

      const response = await this.client.post('/connector.php', formData)
      return response.data
    } catch (error) {
      console.error('BaseLinker API Error:', error)
      throw new Error(`BaseLinker API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Product Management Methods
  async addProduct(product: BaseLinkerProduct): Promise<BaseLinkerResponse<{ product_id: number }>> {
    return this.makeRequest('addProduct', {
      inventory_id: 1, // Default inventory
      product_id: product.product_id,
      ean: product.ean,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      category_id: product.category_id,
      weight: product.weight,
      dimension_w: product.dimension_w,
      dimension_h: product.dimension_h,
      dimension_d: product.dimension_d,
      images: product.images,
      features: product.features
    })
  }

  async updateProduct(productId: string, product: Partial<BaseLinkerProduct>): Promise<BaseLinkerResponse> {
    return this.makeRequest('updateInventoryProductsData', {
      inventory_id: 1,
      products: {
        [productId]: product
      }
    })
  }

  async getProduct(productId: string): Promise<BaseLinkerResponse<BaseLinkerProduct>> {
    const response = await this.makeRequest<{ products: Record<string, BaseLinkerProduct> }>('getInventoryProductsData', {
      inventory_id: 1,
      products: [productId]
    })
    
    if (response.status === 'SUCCESS' && response.data?.products?.[productId]) {
      return {
        status: 'SUCCESS',
        data: response.data.products[productId]
      }
    }
    
    return {
      status: 'ERROR',
      error_message: 'Product not found'
    }
  }

  async getProducts(page: number = 1, limit: number = 100): Promise<BaseLinkerResponse<{ products: Record<string, BaseLinkerProduct> }>> {
    return this.makeRequest('getInventoryProductsList', {
      inventory_id: 1,
      filter_category_id: null,
      filter_limit: limit,
      filter_offset: (page - 1) * limit,
      filter_sort: 'id [ASC]'
    })
  }

  async deleteProduct(productId: string): Promise<BaseLinkerResponse> {
    return this.makeRequest('deleteInventoryProduct', {
      product_id: productId
    })
  }

  // Inventory Management
  async updateInventory(productId: string, quantity: number): Promise<BaseLinkerResponse> {
    return this.makeRequest('updateInventoryProductsStock', {
      inventory_id: 1,
      products: {
        [productId]: {
          quantity: quantity
        }
      }
    })
  }

  // Categories
  async getCategories(): Promise<BaseLinkerResponse<{ categories: Array<{ category_id: number, name: string, parent_id: number }> }>> {
    return this.makeRequest('getInventoryCategories', {
      inventory_id: 1
    })
  }

  async addCategory(name: string, parentId?: number): Promise<BaseLinkerResponse<{ category_id: number }>> {
    return this.makeRequest('addInventoryCategory', {
      inventory_id: 1,
      category_name: name,
      parent_id: parentId
    })
  }

  // Images
  async addProductImage(productId: string, imageUrl: string): Promise<BaseLinkerResponse> {
    return this.makeRequest('addInventoryProductImage', {
      product_id: productId,
      image_url: imageUrl
    })
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('getInventories')
      return response.status === 'SUCCESS'
    } catch {
      return false
    }
  }
}

// Product conversion utilities
export function convertProductToBaseLinker(product: InputProduct): BaseLinkerProduct {
  // Safely parse dimensions
  let parsedDimensions: { width?: number; height?: number; depth?: number } | null = null
  if (product.dimensions && typeof product.dimensions === 'object') {
    try {
      const dims = product.dimensions as Record<string, unknown>
      parsedDimensions = {
        width: typeof dims.width === 'number' ? dims.width : undefined,
        height: typeof dims.height === 'number' ? dims.height : undefined,
        depth: typeof dims.depth === 'number' ? dims.depth : undefined
      }
    } catch {
      parsedDimensions = null
    }
  }

  return {
    ean: product.upc || product.ean || undefined,
    sku: product.sku || product.id || undefined,
    name: product.title || 'Untitled Product',
    description: product.description || '',
    price: product.lowestRecordedPrice || product.price || 0,
    quantity: product.quantity || 1,
    weight: product.weight || undefined,
    dimension_w: parsedDimensions?.width || undefined,
    dimension_h: parsedDimensions?.height || undefined,
    dimension_d: parsedDimensions?.depth || undefined,
    images: product.images?.map((img) => img.originalUrl || img.url).filter((url): url is string => Boolean(url)) || [],
    features: {
      brand: product.brand || '',
      model: product.model || '',
      color: product.color || '',
      size: product.size || '',
      condition: product.condition || 'New'
    }
  }
}

export function convertBaseLinkerToProduct(baselinkerProduct: BaseLinkerProduct): OutputProduct {
  return {
    title: baselinkerProduct.name,
    description: baselinkerProduct.description,
    upc: baselinkerProduct.ean,
    sku: baselinkerProduct.sku,
    price: baselinkerProduct.price,
    quantity: baselinkerProduct.quantity,
    weight: baselinkerProduct.weight,
    dimensions: baselinkerProduct.dimension_w && baselinkerProduct.dimension_h && baselinkerProduct.dimension_d ? {
      width: baselinkerProduct.dimension_w,
      height: baselinkerProduct.dimension_h,
      depth: baselinkerProduct.dimension_d
    } : null,
    brand: baselinkerProduct.features?.brand,
    model: baselinkerProduct.features?.model,
    color: baselinkerProduct.features?.color,
    size: baselinkerProduct.features?.size,
    condition: baselinkerProduct.features?.condition || 'New',
    images: baselinkerProduct.images?.map(url => ({ originalUrl: url })) || []
  }
}