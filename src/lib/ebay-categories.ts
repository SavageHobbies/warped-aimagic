/**
 * eBay Category Specifications
 * Defines category-specific item specifics requirements, variant support, and field mappings
 */

export interface EbayItemSpecific {
  name: string
  required: boolean
  type: 'text' | 'select' | 'multiselect' | 'number' | 'boolean'
  options?: string[]
  placeholder?: string
  description?: string
  maxLength?: number
}

export interface EbayVariant {
  name: string
  type: 'text' | 'select' | 'color' | 'size'
  options?: string[]
  required: boolean
}

export interface EbayCategorySpec {
  categoryId: string
  categoryName: string
  categoryPath: string
  
  // Item specifics for this category
  itemSpecifics: EbayItemSpecific[]
  
  // Variant support (for products with multiple options)
  variants?: EbayVariant[]
  supportsVariants: boolean
  
  // Category-specific features
  features: {
    supportsVideo: boolean
    maxImages: number
    requiresAuthenticity?: boolean
    requiresConditionDetails?: boolean
    supportsCustomLabel: boolean
  }
  
  // Detection keywords to automatically assign this category
  detectionKeywords: string[]
  
  // Parent category for hierarchy
  parentCategoryId?: string
}

// Common item specifics shared across many categories
export const COMMON_SPECIFICS: EbayItemSpecific[] = [
  {
    name: 'Brand',
    required: true,
    type: 'text',
    placeholder: 'Enter brand name',
    description: 'Manufacturer or brand name'
  },
  {
    name: 'UPC',
    required: true,
    type: 'text',
    placeholder: 'UPC barcode',
    description: 'Universal Product Code'
  },
  {
    name: 'Condition',
    required: true,
    type: 'select',
    options: [
      'New',
      'New other (see details)',
      'New with defects',
      'Manufacturer refurbished',
      'Seller refurbished',
      'Used',
      'Very Good',
      'Good',
      'Acceptable',
      'For parts or not working'
    ]
  },
  {
    name: 'MPN',
    required: false,
    type: 'text',
    placeholder: 'Manufacturer Part Number',
    description: 'Official part number from manufacturer'
  },
  {
    name: 'Country/Region of Manufacture',
    required: false,
    type: 'select',
    options: [
      'United States',
      'China',
      'Japan',
      'Germany',
      'United Kingdom',
      'Canada',
      'Mexico',
      'South Korea',
      'Taiwan',
      'Other'
    ]
  }
]

// Size options for clothing and accessories
export const CLOTHING_SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20', '22', '24',
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'
]

export const SHOE_SIZES = [
  '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', 
  '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14', '15'
]

export const COMMON_COLORS = [
  'Black', 'White', 'Gray', 'Silver', 'Red', 'Blue', 'Green', 'Yellow',
  'Orange', 'Pink', 'Purple', 'Brown', 'Beige', 'Gold', 'Navy', 'Maroon',
  'Teal', 'Turquoise', 'Lime', 'Magenta', 'Multicolor'
]

/**
 * eBay Category Specifications Database
 */
export const EBAY_CATEGORY_SPECS: Record<string, EbayCategorySpec> = {
  // Funko Pop & Collectibles
  'funko_pops': {
    categoryId: '149372',
    categoryName: 'Funko Pop!',
    categoryPath: 'Collectibles > Pinbacks, Bobbles, Lunchboxes > Bobbleheads, Nodders > Funko',
    supportsVariants: false,
    detectionKeywords: ['funko', 'pop', 'bobblehead', 'vinyl figure'],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Character',
        required: true,
        type: 'text',
        placeholder: 'Character name',
        description: 'Main character featured'
      },
      {
        name: 'Series',
        required: false,
        type: 'text',
        placeholder: 'Series or collection name',
        description: 'Funko series or collection'
      },
      {
        name: 'Franchise',
        required: true,
        type: 'text',
        placeholder: 'Movie, TV show, game, etc.',
        description: 'Source franchise or property'
      },
      {
        name: 'Material',
        required: false,
        type: 'select',
        options: ['Vinyl', 'Plastic', 'Mixed Materials']
      },
      {
        name: 'Age Level',
        required: false,
        type: 'select',
        options: ['3+', '8+', '12+', '14+', '17+']
      },
      {
        name: 'Type',
        required: true,
        type: 'select',
        options: ['Pop! Vinyl', 'Pop! Rides', 'Pop! Town', 'Pop! Moments', 'Pop! Albums']
      },
      {
        name: 'Size',
        required: false,
        type: 'select',
        options: ['3 3/4 in', '6 in', '10 in', '18 in']
      },
      {
        name: 'Exclusivity',
        required: false,
        type: 'select',
        options: ['Common', 'Exclusive', 'Chase', 'Limited Edition', 'Convention Exclusive']
      }
    ],
    features: {
      supportsVideo: true,
      maxImages: 12,
      requiresAuthenticity: true,
      supportsCustomLabel: true
    }
  },

  // Women's Clothing
  'womens_clothing': {
    categoryId: '15724',
    categoryName: "Women's Clothing",
    categoryPath: 'Clothing, Shoes & Accessories > Women > Women\'s Clothing',
    supportsVariants: true,
    detectionKeywords: ['dress', 'shirt', 'blouse', 'top', 'pants', 'jeans', 'skirt', 'women'],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Department',
        required: true,
        type: 'select',
        options: ['Women']
      },
      {
        name: 'Type',
        required: true,
        type: 'select',
        options: [
          'Dress', 'Top', 'Blouse', 'Shirt', 'T-Shirt', 'Tank Top', 'Sweater',
          'Cardigan', 'Jacket', 'Coat', 'Pants', 'Jeans', 'Shorts', 'Skirt',
          'Jumpsuit', 'Romper', 'Activewear', 'Sleepwear', 'Underwear'
        ]
      },
      {
        name: 'Style',
        required: false,
        type: 'select',
        options: ['Casual', 'Business', 'Evening', 'Formal', 'Bohemian', 'Vintage', 'Modern']
      },
      {
        name: 'Sleeve Length',
        required: false,
        type: 'select',
        options: ['Sleeveless', 'Short Sleeve', '3/4 Sleeve', 'Long Sleeve']
      },
      {
        name: 'Neckline',
        required: false,
        type: 'select',
        options: ['Crew', 'V-Neck', 'Scoop', 'Boat', 'Off Shoulder', 'Strapless', 'High Neck']
      },
      {
        name: 'Fit',
        required: false,
        type: 'select',
        options: ['Regular', 'Slim', 'Loose', 'Oversized', 'Fitted']
      },
      {
        name: 'Occasion',
        required: false,
        type: 'select',
        options: ['Casual', 'Work', 'Party', 'Wedding', 'Vacation', 'Date Night']
      },
      {
        name: 'Season',
        required: false,
        type: 'select',
        options: ['Spring', 'Summer', 'Fall', 'Winter', 'All Seasons']
      }
    ],
    variants: [
      {
        name: 'Size',
        type: 'select',
        options: CLOTHING_SIZES,
        required: true
      },
      {
        name: 'Color',
        type: 'select',
        options: COMMON_COLORS,
        required: true
      }
    ],
    features: {
      supportsVideo: true,
      maxImages: 12,
      requiresConditionDetails: true,
      supportsCustomLabel: true
    }
  },

  // Men's Clothing
  'mens_clothing': {
    categoryId: '1059',
    categoryName: "Men's Clothing",
    categoryPath: 'Clothing, Shoes & Accessories > Men > Men\'s Clothing',
    supportsVariants: true,
    detectionKeywords: ['mens', 'men', 'shirt', 'pants', 'jeans', 'jacket', 'suit'],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Department',
        required: true,
        type: 'select',
        options: ['Men']
      },
      {
        name: 'Type',
        required: true,
        type: 'select',
        options: [
          'Shirt', 'T-Shirt', 'Polo', 'Tank Top', 'Sweater', 'Cardigan',
          'Jacket', 'Coat', 'Blazer', 'Suit', 'Pants', 'Jeans', 'Shorts',
          'Activewear', 'Sleepwear', 'Underwear'
        ]
      },
      {
        name: 'Fit',
        required: false,
        type: 'select',
        options: ['Regular', 'Slim', 'Relaxed', 'Athletic', 'Big & Tall']
      },
      {
        name: 'Collar Type',
        required: false,
        type: 'select',
        options: ['Crew', 'V-Neck', 'Button Down', 'Spread', 'Point', 'No Collar']
      }
    ],
    variants: [
      {
        name: 'Size',
        type: 'select',
        options: CLOTHING_SIZES,
        required: true
      },
      {
        name: 'Color',
        type: 'select',
        options: COMMON_COLORS,
        required: true
      }
    ],
    features: {
      supportsVideo: true,
      maxImages: 12,
      requiresConditionDetails: true,
      supportsCustomLabel: true
    }
  },

  // Electronics
  'electronics': {
    categoryId: '293',
    categoryName: 'Electronics',
    categoryPath: 'Consumer Electronics',
    supportsVariants: false,
    detectionKeywords: ['electronic', 'phone', 'computer', 'tablet', 'camera', 'headphones'],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Type',
        required: true,
        type: 'select',
        options: [
          'Smartphone', 'Tablet', 'Laptop', 'Desktop', 'Monitor', 'TV',
          'Camera', 'Headphones', 'Speaker', 'Gaming Console', 'Accessory'
        ]
      },
      {
        name: 'Connectivity',
        required: false,
        type: 'multiselect',
        options: ['Bluetooth', 'Wi-Fi', 'USB', 'HDMI', 'Ethernet', 'Wireless']
      },
      {
        name: 'Color',
        required: false,
        type: 'select',
        options: COMMON_COLORS
      },
      {
        name: 'Storage Capacity',
        required: false,
        type: 'select',
        options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']
      },
      {
        name: 'Features',
        required: false,
        type: 'multiselect',
        options: ['Touchscreen', 'Waterproof', 'Wireless Charging', 'Fast Charging', 'HD Video']
      }
    ],
    features: {
      supportsVideo: true,
      maxImages: 12,
      requiresAuthenticity: true,
      supportsCustomLabel: true
    }
  },

  // Toys & Games
  'toys_games': {
    categoryId: '220',
    categoryName: 'Toys & Games',
    categoryPath: 'Toys & Hobbies',
    supportsVariants: false,
    detectionKeywords: ['toy', 'game', 'puzzle', 'doll', 'action figure', 'board game'],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Age Level',
        required: true,
        type: 'select',
        options: ['0-6 months', '6-12 months', '12-24 months', '2-4 years', '5-7 years', '8-11 years', '12-16 years', '17+ years']
      },
      {
        name: 'Type',
        required: true,
        type: 'select',
        options: [
          'Action Figure', 'Doll', 'Board Game', 'Card Game', 'Puzzle',
          'Building Set', 'Educational Toy', 'Electronic Toy', 'Plush',
          'Vehicle', 'Outdoor Toy', 'Craft Kit'
        ]
      },
      {
        name: 'Character Family',
        required: false,
        type: 'text',
        placeholder: 'e.g., Marvel, Disney, Pokemon',
        description: 'Franchise or character series'
      },
      {
        name: 'Material',
        required: false,
        type: 'select',
        options: ['Plastic', 'Wood', 'Metal', 'Fabric', 'Paper', 'Mixed Materials']
      },
      {
        name: 'Features',
        required: false,
        type: 'multiselect',
        options: ['Lights', 'Sounds', 'Motion', 'Remote Control', 'Educational', 'Interactive']
      }
    ],
    features: {
      supportsVideo: true,
      maxImages: 12,
      requiresAuthenticity: false,
      supportsCustomLabel: true
    }
  },

  // Books
  'books': {
    categoryId: '267',
    categoryName: 'Books',
    categoryPath: 'Books & Magazines > Books',
    supportsVariants: false,
    detectionKeywords: ['book', 'novel', 'textbook', 'magazine', 'manual'],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Format',
        required: true,
        type: 'select',
        options: ['Paperback', 'Hardcover', 'Mass Market Paperback', 'Board Book', 'Spiral-bound']
      },
      {
        name: 'Language',
        required: true,
        type: 'select',
        options: ['English', 'Spanish', 'French', 'German', 'Italian', 'Other']
      },
      {
        name: 'Genre',
        required: false,
        type: 'select',
        options: [
          'Fiction', 'Non-Fiction', 'Biography', 'History', 'Science',
          'Technology', 'Self-Help', 'Business', 'Children', 'Young Adult',
          'Romance', 'Mystery', 'Fantasy', 'Science Fiction'
        ]
      },
      {
        name: 'Publication Year',
        required: false,
        type: 'number',
        placeholder: 'YYYY'
      },
      {
        name: 'Publisher',
        required: false,
        type: 'text',
        placeholder: 'Publisher name'
      },
      {
        name: 'ISBN',
        required: false,
        type: 'text',
        placeholder: 'ISBN-10 or ISBN-13'
      }
    ],
    features: {
      supportsVideo: false,
      maxImages: 8,
      requiresConditionDetails: true,
      supportsCustomLabel: true
    }
  },

  // Default/General category
  'general': {
    categoryId: '1',
    categoryName: 'General',
    categoryPath: 'Everything Else',
    supportsVariants: false,
    detectionKeywords: [],
    itemSpecifics: [
      ...COMMON_SPECIFICS,
      {
        name: 'Type',
        required: false,
        type: 'text',
        placeholder: 'Product type',
        description: 'General product category'
      },
      {
        name: 'Color',
        required: false,
        type: 'select',
        options: COMMON_COLORS
      },
      {
        name: 'Material',
        required: false,
        type: 'text',
        placeholder: 'Primary material'
      },
      {
        name: 'Features',
        required: false,
        type: 'text',
        placeholder: 'Key features',
        description: 'Main product features'
      }
    ],
    features: {
      supportsVideo: true,
      maxImages: 12,
      supportsCustomLabel: true
    }
  }
}

/**
 * Auto-detect eBay category based on product data
 */
export function detectEbayCategory(product: {
  title?: string
  description?: string
  brand?: string
  categories?: Array<{ category: { name?: string; fullPath?: string } }>
}): string {
  const searchText = [
    product.title || '',
    product.description || '',
    product.brand || '',
    ...(product.categories || []).map(c => c.category.name || c.category.fullPath || '')
  ].join(' ').toLowerCase()

  // Check each category's detection keywords
  for (const [categoryKey, spec] of Object.entries(EBAY_CATEGORY_SPECS)) {
    if (categoryKey === 'general') continue // Skip general as fallback
    
    for (const keyword of spec.detectionKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return categoryKey
      }
    }
  }

  return 'general' // Default fallback
}

/**
 * Get category specification by key
 */
export function getCategorySpec(categoryKey: string): EbayCategorySpec {
  return EBAY_CATEGORY_SPECS[categoryKey] || EBAY_CATEGORY_SPECS.general
}

/**
 * Get all available categories
 */
export function getAllCategories(): Array<{ key: string; spec: EbayCategorySpec }> {
  return Object.entries(EBAY_CATEGORY_SPECS).map(([key, spec]) => ({ key, spec }))
}

/**
 * Validate item specifics for a category
 */
export function validateItemSpecifics(
  categoryKey: string, 
  itemSpecifics: Record<string, string>
): { isValid: boolean; missingRequired: string[]; errors: string[] } {
  const spec = getCategorySpec(categoryKey)
  const missingRequired: string[] = []
  const errors: string[] = []

  for (const specific of spec.itemSpecifics) {
    const value = itemSpecifics[specific.name]
    
    if (specific.required && (!value || value.trim() === '')) {
      missingRequired.push(specific.name)
    }
    
    if (value && specific.maxLength && value.length > specific.maxLength) {
      errors.push(`${specific.name} exceeds maximum length of ${specific.maxLength} characters`)
    }
  }

  return {
    isValid: missingRequired.length === 0 && errors.length === 0,
    missingRequired,
    errors
  }
}