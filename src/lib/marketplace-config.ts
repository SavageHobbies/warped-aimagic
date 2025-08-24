// Marketplace configuration and utilities
export interface MarketplaceConfig {
  id: string
  name: string
  displayName: string
  isEnabled: boolean
  apiConfig?: {
    apiKey?: string
    apiSecret?: string
    endpoint?: string
    environment?: 'sandbox' | 'production'
  }
  fieldMapping?: {
    title?: {
      maxLength: number
      required: boolean
      transform?: string
    }
    description?: {
      maxLength: number
      required: boolean
      allowHtml: boolean
    }
    price?: {
      currency: string
      minPrice?: number
      maxPrice?: number
    }
    category?: {
      required: boolean
      mappingTable?: Record<string, string>
    }
    images?: {
      maxCount: number
      maxSize: number
      allowedFormats: string[]
    }
  }
  templates?: {
    titleTemplate?: string
    descriptionTemplate?: string
    defaultCategories?: string[]
  }
  exportFields?: string[]
}

export const MARKETPLACE_CONFIGS: Record<string, MarketplaceConfig> = {
  EBAY: {
    id: 'EBAY',
    name: 'EBAY',
    displayName: 'eBay',
    isEnabled: true,
    fieldMapping: {
      title: {
        maxLength: 80,
        required: true,
        transform: 'uppercase_first_word'
      },
      description: {
        maxLength: 500000,
        required: true,
        allowHtml: true
      },
      price: {
        currency: 'USD',
        minPrice: 0.01
      },
      category: {
        required: true
      },
      images: {
        maxCount: 12,
        maxSize: 7000000, // 7MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif']
      }
    },
    templates: {
      titleTemplate: '{brand} {title} - {condition}',
      descriptionTemplate: '{description}\n\nCondition: {condition}\nBrand: {brand}\nUPC: {upc}',
      defaultCategories: ['177']
    },
    exportFields: [
      'title', 'description', 'price', 'quantity', 'condition', 'upc', 
      'brand', 'model', 'color', 'size', 'weight', 'dimensions'
    ]
  },
  
  AMAZON: {
    id: 'AMAZON',
    name: 'AMAZON',
    displayName: 'Amazon',
    isEnabled: true,
    fieldMapping: {
      title: {
        maxLength: 200,
        required: true
      },
      description: {
        maxLength: 2000,
        required: true,
        allowHtml: false
      },
      price: {
        currency: 'USD',
        minPrice: 0.01
      },
      category: {
        required: true
      },
      images: {
        maxCount: 9,
        maxSize: 10000000, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'tiff']
      }
    },
    templates: {
      titleTemplate: '{brand} {title}',
      descriptionTemplate: '{description}',
      defaultCategories: ['Everything Else']
    },
    exportFields: [
      'title', 'description', 'price', 'quantity', 'condition', 'upc',
      'brand', 'model', 'color', 'size', 'weight', 'dimensions', 'category'
    ]
  },

  WALMART: {
    id: 'WALMART',
    name: 'WALMART',
    displayName: 'Walmart Marketplace',
    isEnabled: true,
    fieldMapping: {
      title: {
        maxLength: 75,
        required: true
      },
      description: {
        maxLength: 4000,
        required: true,
        allowHtml: false
      },
      price: {
        currency: 'USD',
        minPrice: 0.01
      },
      category: {
        required: true
      },
      images: {
        maxCount: 8,
        maxSize: 5000000, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png']
      }
    },
    templates: {
      titleTemplate: '{brand} {title}',
      descriptionTemplate: '{description}',
      defaultCategories: ['Other']
    },
    exportFields: [
      'title', 'description', 'price', 'quantity', 'condition', 'upc',
      'brand', 'model', 'color', 'size', 'weight'
    ]
  },

  FACEBOOK: {
    id: 'FACEBOOK',
    name: 'FACEBOOK',
    displayName: 'Facebook Marketplace',
    isEnabled: true,
    fieldMapping: {
      title: {
        maxLength: 100,
        required: true
      },
      description: {
        maxLength: 9999,
        required: true,
        allowHtml: false
      },
      price: {
        currency: 'USD',
        minPrice: 0.01
      },
      category: {
        required: true
      },
      images: {
        maxCount: 10,
        maxSize: 8000000, // 8MB
        allowedFormats: ['jpg', 'jpeg', 'png']
      }
    },
    templates: {
      titleTemplate: '{title} - {condition}',
      descriptionTemplate: '{description}\n\nCondition: {condition}\nBrand: {brand}',
      defaultCategories: ['Other']
    },
    exportFields: [
      'title', 'description', 'price', 'quantity', 'condition',
      'brand', 'model', 'color', 'size'
    ]
  },

  BASELINKER: {
    id: 'BASELINKER',
    name: 'BASELINKER',
    displayName: 'BaseLinker',
    isEnabled: true,
    apiConfig: {
      endpoint: 'https://api.baselinker.com/connector.php',
      environment: 'production'
    },
    fieldMapping: {
      title: {
        maxLength: 255,
        required: true
      },
      description: {
        maxLength: 65535,
        required: false,
        allowHtml: true
      },
      price: {
        currency: 'USD',
        minPrice: 0.01
      },
      images: {
        maxCount: 16,
        maxSize: 10000000, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif']
      }
    },
    templates: {
      titleTemplate: '{brand} {title}',
      descriptionTemplate: '{description}',
    },
    exportFields: [
      'title', 'description', 'price', 'quantity', 'condition', 'upc',
      'brand', 'model', 'color', 'size', 'weight', 'dimensions'
    ]
  }
}

// CSV Export field mappings
export const CSV_EXPORT_TEMPLATES = {
  EBAY: {
    filename: 'ebay_listings_{timestamp}.csv',
    headers: [
      'Title', 'Description', 'StartPrice', 'Quantity', 'Category',
      'Condition', 'UPC', 'Brand', 'MPN', 'Color', 'Size', 'Weight',
      'Length', 'Width', 'Height', 'Images'
    ]
  },
  AMAZON: {
    filename: 'amazon_listings_{timestamp}.csv',
    headers: [
      'Product Name', 'Product Description', 'Price', 'Quantity',
      'Product ID', 'Brand Name', 'Model', 'Color', 'Size',
      'Item Weight', 'Product Dimensions', 'Main Image URL'
    ]
  },
  WALMART: {
    filename: 'walmart_listings_{timestamp}.csv',
    headers: [
      'Product Name', 'Long Description', 'Price', 'Inventory Count',
      'UPC', 'Brand', 'Model Number', 'Color', 'Size', 'Weight',
      'Main Image URL'
    ]
  },
  FACEBOOK: {
    filename: 'facebook_listings_{timestamp}.csv',
    headers: [
      'Title', 'Description', 'Price', 'Availability', 'Condition',
      'Brand', 'Color', 'Size', 'Image Link'
    ]
  },
  BASELINKER: {
    filename: 'baselinker_export_{timestamp}.csv',
    headers: [
      'name', 'description', 'price', 'quantity', 'ean', 'sku',
      'brand', 'model', 'color', 'size', 'weight', 'dimensions', 'images'
    ]
  }
}

// Utility functions
export function getMarketplaceConfig(marketplaceName: string): MarketplaceConfig | null {
  return MARKETPLACE_CONFIGS[marketplaceName.toUpperCase()] || null
}

export function validateFieldForMarketplace(
  fieldName: string, 
  value: string, 
  marketplaceName: string
): { isValid: boolean; error?: string } {
  const config = getMarketplaceConfig(marketplaceName)
  if (!config || !config.fieldMapping) {
    return { isValid: true }
  }

  const fieldConfig = config.fieldMapping[fieldName as keyof typeof config.fieldMapping]
  if (!fieldConfig) {
    return { isValid: true }
  }

  // Check required fields
  if ('required' in fieldConfig && fieldConfig.required && (!value || value.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required for ${config.displayName}` }
  }

  // Check max length
  if ('maxLength' in fieldConfig && fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} exceeds maximum length of ${fieldConfig.maxLength} characters for ${config.displayName}` 
    }
  }

  return { isValid: true }
}

export function transformFieldForMarketplace(
  fieldName: string,
  value: string,
  marketplaceName: string
): string {
  const config = getMarketplaceConfig(marketplaceName)
  if (!config || !config.fieldMapping) {
    return value
  }

  const fieldConfig = config.fieldMapping[fieldName as keyof typeof config.fieldMapping]
  if (!fieldConfig || !('transform' in fieldConfig)) {
    return value
  }

  // Apply transformations based on marketplace requirements
  switch (fieldConfig.transform) {
    case 'uppercase_first_word':
      return value.replace(/^\w/, (c) => c.toUpperCase())
    case 'uppercase':
      return value.toUpperCase()
    case 'lowercase':
      return value.toLowerCase()
    default:
      return value
  }
}

// Product interface for marketplace functions
export interface MarketplaceProduct {
  title?: string
  description?: string
  brand?: string
  condition?: string
  model?: string
  color?: string
  size?: string
  upc?: string
  [key: string]: unknown
}

export function generateListingTitle(
  product: MarketplaceProduct,
  marketplaceName: string
): string {
  const config = getMarketplaceConfig(marketplaceName)
  if (!config || !config.templates?.titleTemplate) {
    return product.title || 'Untitled Product'
  }

  let title = config.templates.titleTemplate
  
  // Replace template variables
  title = title.replace('{brand}', product.brand || '')
  title = title.replace('{title}', product.title || '')
  title = title.replace('{condition}', product.condition || 'New')
  title = title.replace('{model}', product.model || '')
  title = title.replace('{color}', product.color || '')
  title = title.replace('{size}', product.size || '')

  // Clean up extra spaces and dashes
  title = title.replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim()

  return title
}

export function generateListingDescription(
  product: MarketplaceProduct,
  marketplaceName: string
): string {
  const config = getMarketplaceConfig(marketplaceName)
  if (!config || !config.templates?.descriptionTemplate) {
    return product.description || ''
  }

  let description = config.templates.descriptionTemplate
  
  // Replace template variables
  description = description.replace('{description}', product.description || '')
  description = description.replace('{condition}', product.condition || 'New')
  description = description.replace('{brand}', product.brand || '')
  description = description.replace('{upc}', product.upc || '')
  description = description.replace('{model}', product.model || '')
  description = description.replace('{color}', product.color || '')
  description = description.replace('{size}', product.size || '')

  return description.trim()
}