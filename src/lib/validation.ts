// Marketplace validation rules and utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  customValidator?: (value: unknown) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface FieldValidation {
  field: string
  message: string
  type: 'error' | 'warning'
}

// Marketplace-specific validation rules
export const MARKETPLACE_VALIDATION_RULES: Record<string, Record<string, ValidationRule>> = {
  EBAY: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 80,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (!stringValue) return 'Title is required'
        if (stringValue.length > 80) return 'eBay titles must be 80 characters or less'
        if (stringValue.includes('***')) return 'Titles cannot contain *** (asterisks)'
        if (stringValue.toLowerCase().includes('look') && stringValue.toLowerCase().includes('like')) {
          return 'Avoid using "look" and "like" together - violates eBay policy'
        }
        return null
      }
    },
    description: {
      required: false,
      maxLength: 500000,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (stringValue && stringValue.length > 500000) return 'Description too long'
        // Check for prohibited content
        const prohibited = ['email', '@', 'phone', 'call me', 'text me']
        const lowerValue = stringValue?.toLowerCase() || ''
        for (const term of prohibited) {
          if (lowerValue.includes(term)) {
            return `Description should not contain "${term}" - may violate eBay policy`
          }
        }
        return null
      }
    },
    price: {
      required: true,
      customValidator: (value: unknown) => {
        const numValue = value as number
        if (!numValue || numValue <= 0) return 'Price must be greater than $0'
        if (numValue < 0.99) return 'eBay minimum price is $0.99'
        if (numValue > 999999.99) return 'Price cannot exceed $999,999.99'
        return null
      }
    },
    brand: {
      required: false,
      maxLength: 65,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (stringValue && stringValue.length > 65) return 'Brand name too long'
        return null
      }
    },
    condition: {
      required: true,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        const validConditions = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable', 'Used', 'For Parts']
        if (!stringValue) return 'Condition is required'
        if (!validConditions.includes(stringValue)) return 'Invalid condition selected'
        return null
      }
    },
    ebayCategory: {
      required: true,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (!stringValue) return 'eBay category is required'
        return null
      }
    },
    quantity: {
      required: true,
      customValidator: (value: unknown) => {
        const numValue = value as number
        if (!numValue || numValue < 1) return 'Quantity must be at least 1'
        if (numValue > 999) return 'Maximum quantity is 999'
        return null
      }
    },
    images: {
      required: true,
      customValidator: (value: unknown) => {
        const arrayValue = value as unknown[]
        if (!arrayValue || arrayValue.length === 0) return 'At least one image is required'
        if (arrayValue.length > 12) return 'Maximum 12 images allowed'
        return null
      }
    }
  },
  AMAZON: {
    title: {
      required: true,
      minLength: 1,
      maxLength: 200,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (!stringValue) return 'Title is required'
        if (stringValue.length > 200) return 'Amazon titles must be 200 characters or less'
        if (stringValue.includes('***')) return 'Titles cannot contain *** (asterisks)'
        return null
      }
    },
    description: {
      required: false,
      maxLength: 2000,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (stringValue && stringValue.length > 2000) return 'Description must be 2000 characters or less'
        return null
      }
    },
    price: {
      required: true,
      customValidator: (value: unknown) => {
        const numValue = value as number
        if (!numValue || numValue <= 0) return 'Price must be greater than $0'
        return null
      }
    },
    brand: {
      required: true,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (!stringValue) return 'Brand is required for Amazon'
        return null
      }
    },
    condition: {
      required: true,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        const validConditions = ['New', 'Used - Like New', 'Used - Very Good', 'Used - Good', 'Used - Acceptable']
        if (!stringValue) return 'Condition is required'
        if (!validConditions.includes(stringValue)) return 'Invalid condition for Amazon'
        return null
      }
    },
    upc: {
      required: false,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (stringValue && stringValue.length !== 12) return 'UPC must be 12 digits'
        if (stringValue && !/^\d+$/.test(stringValue)) return 'UPC must contain only numbers'
        return null
      }
    }
  },
  MERCARI: {
    title: {
      required: true,
      maxLength: 40,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (!stringValue) return 'Title is required'
        if (stringValue.length > 40) return 'Mercari titles must be 40 characters or less'
        return null
      }
    },
    description: {
      required: true,
      maxLength: 1000,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        if (!stringValue) return 'Description is required for Mercari'
        if (stringValue.length > 1000) return 'Description must be 1000 characters or less'
        return null
      }
    },
    price: {
      required: true,
      customValidator: (value: unknown) => {
        const numValue = value as number
        if (!numValue || numValue <= 0) return 'Price must be greater than $0'
        if (numValue < 3) return 'Mercari minimum price is $3'
        return null
      }
    },
    condition: {
      required: true,
      customValidator: (value: unknown) => {
        const stringValue = value as string
        const validConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor']
        if (!stringValue) return 'Condition is required'
        if (!validConditions.includes(stringValue)) return 'Invalid condition for Mercari'
        return null
      }
    }
  }
}

// Draft data interface
export interface DraftData {
  title?: string
  description?: string
  price?: number
  brand?: string
  condition?: string
  ebayCategory?: string
  quantity?: number
  images?: unknown[]
  upc?: string
  listingFormat?: string
  startPrice?: number
  buyItNowPrice?: number
  acceptBestOffer?: boolean
  [key: string]: unknown
}

// Validation utility functions
export function validateField(
  platform: string, 
  fieldName: string, 
  value: unknown
): FieldValidation | null {
  const rules = MARKETPLACE_VALIDATION_RULES[platform?.toUpperCase()]
  if (!rules || !rules[fieldName]) return null

  const rule = rules[fieldName]
  
  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return {
      field: fieldName,
      message: `${fieldName} is required for ${platform}`,
      type: 'error'
    }
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null
  }

  // Length validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be at least ${rule.minLength} characters`,
        type: 'error'
      }
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return {
        field: fieldName,
        message: `${fieldName} must be ${rule.maxLength} characters or less`,
        type: 'error'
      }
    }
  }

  // Pattern validation
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} format is invalid`,
      type: 'error'
    }
  }

  // Custom validation
  if (rule.customValidator) {
    const customError = rule.customValidator(value)
    if (customError) {
      return {
        field: fieldName,
        message: customError,
        type: 'error'
      }
    }
  }

  return null
}

export function validateDraft(platform: string, draftData: DraftData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const rules = MARKETPLACE_VALIDATION_RULES[platform?.toUpperCase()]
  if (!rules) {
    warnings.push(`No validation rules found for platform: ${platform}`)
    return { isValid: true, errors, warnings }
  }

  // Validate each field
  Object.keys(rules).forEach(fieldName => {
    const value = draftData[fieldName]
    const validation = validateField(platform, fieldName, value)
    
    if (validation) {
      if (validation.type === 'error') {
        errors.push(validation.message)
      } else {
        warnings.push(validation.message)
      }
    }
  })

  // Additional cross-field validations
  if (platform.toUpperCase() === 'EBAY') {
    // eBay specific cross-validations
    if (draftData.listingFormat === 'Auction') {
      if (!draftData.startPrice || draftData.startPrice <= 0) {
        errors.push('Starting price is required for auction listings')
      }
      if (draftData.startPrice && draftData.buyItNowPrice && 
          draftData.startPrice > draftData.buyItNowPrice && draftData.buyItNowPrice > 0) {
        errors.push('Buy It Now price must be higher than starting price')
      }
    }
    
    if (draftData.title && draftData.description) {
      const combinedLength = draftData.title.length + (draftData.description?.length || 0)
      if (combinedLength > 505000) {
        warnings.push('Combined title and description are very long - consider shortening')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function getValidationSummary(platform: string, draftData: DraftData): {
  score: number
  issues: FieldValidation[]
  suggestions: string[]
} {
  const validation = validateDraft(platform, draftData)
  const issues: FieldValidation[] = []
  
  // Convert errors and warnings to FieldValidation format
  validation.errors.forEach(error => {
    issues.push({
      field: 'general',
      message: error,
      type: 'error'
    })
  })
  
  validation.warnings.forEach(warning => {
    issues.push({
      field: 'general',
      message: warning,
      type: 'warning'
    })
  })

  // Calculate quality score (0-100)
  const totalFields = Object.keys(MARKETPLACE_VALIDATION_RULES[platform?.toUpperCase()] || {}).length
  const errorCount = validation.errors.length
  const warningCount = validation.warnings.length
  
  // Remove unused variable warning
  void totalFields
  
  let score = 100
  score -= errorCount * 20 // Each error reduces score by 20
  score -= warningCount * 5 // Each warning reduces score by 5
  score = Math.max(0, score)

  // Optimization suggestions
  const suggestions: string[] = []
  
  if (platform.toUpperCase() === 'EBAY') {
    if (draftData.title && draftData.title.length < 60) {
      suggestions.push('Consider using more descriptive keywords in your title (up to 80 characters)')
    }
    
    if (!draftData.description || draftData.description.length < 100) {
      suggestions.push('Add a detailed description to improve buyer confidence')
    }
    
    if (!draftData.images || draftData.images.length < 3) {
      suggestions.push('Add more images to showcase your product (up to 12 images)')
    }
    
    if (draftData.acceptBestOffer === false) {
      suggestions.push('Consider enabling "Best Offer" to increase sales potential')
    }
  }

  return { score, issues, suggestions }
}