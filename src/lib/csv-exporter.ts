// CSV Export Utilities
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { CSV_EXPORT_TEMPLATES, getMarketplaceConfig } from './marketplace-config'

// Product interface for CSV export
export interface Product {
  id?: string
  title?: string
  description?: string
  price?: number
  lowestRecordedPrice?: number
  quantity?: number
  upc?: string
  ean?: string
  sku?: string
  brand?: string
  model?: string
  mpn?: string
  color?: string
  size?: string
  weight?: number
  condition?: string
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  images?: Array<{
    originalUrl?: string
    url?: string
  }>
}

export interface CSVExportOptions {
  marketplace: string
  products: Product[]
  customFields?: string[]
  filename?: string
  outputDir?: string
}

export interface CSVExportResult {
  success: boolean
  filename?: string
  filePath?: string
  rowCount?: number
  error?: string
}

export class CSVExporter {
  private outputDir: string

  constructor(outputDir: string = './exports') {
    this.outputDir = outputDir
    this.ensureOutputDir()
  }

  private ensureOutputDir(): void {
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true })
    }
  }

  private escapeCsvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    const str = String(value)
    
    // If the string contains commas, quotes, or newlines, wrap it in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    
    return str
  }

  private generateFilename(marketplace: string, customFilename?: string): string {
    if (customFilename) {
      return customFilename
    }

    const template = CSV_EXPORT_TEMPLATES[marketplace.toUpperCase() as keyof typeof CSV_EXPORT_TEMPLATES]
    if (template) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      return template.filename.replace('{timestamp}', timestamp)
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    return `${marketplace.toLowerCase()}_export_${timestamp}.csv`
  }

  private mapProductToCSVRow(product: Product, marketplace: string): Record<string, unknown> {
    const marketplaceUpper = marketplace.toUpperCase()
    
    switch (marketplaceUpper) {
      case 'EBAY':
        return {
          'Title': product.title || '',
          'Description': this.formatDescription(product.description || '', 'EBAY'),
          'StartPrice': product.lowestRecordedPrice || product.price || 0,
          'Quantity': product.quantity || 1,
          'Category': this.getEbayCategory(product),
          'Condition': product.condition || 'New',
          'UPC': product.upc || '',
          'Brand': product.brand || '',
          'MPN': product.model || product.mpn || '',
          'Color': product.color || '',
          'Size': product.size || '',
          'Weight': product.weight || '',
          'Length': product.dimensions?.length || '',
          'Width': product.dimensions?.width || '',
          'Height': product.dimensions?.height || '',
          'Images': this.formatImages(product.images)
        }

      case 'AMAZON':
        return {
          'Product Name': product.title || '',
          'Product Description': this.formatDescription(product.description || '', 'AMAZON'),
          'Price': product.lowestRecordedPrice || product.price || 0,
          'Quantity': product.quantity || 1,
          'Product ID': product.upc || product.sku || '',
          'Brand Name': product.brand || '',
          'Model': product.model || '',
          'Color': product.color || '',
          'Size': product.size || '',
          'Item Weight': product.weight || '',
          'Product Dimensions': this.formatDimensions(product.dimensions),
          'Main Image URL': product.images?.[0]?.originalUrl || ''
        }

      case 'WALMART':
        return {
          'Product Name': product.title || '',
          'Long Description': this.formatDescription(product.description || '', 'WALMART'),
          'Price': product.lowestRecordedPrice || product.price || 0,
          'Inventory Count': product.quantity || 1,
          'UPC': product.upc || '',
          'Brand': product.brand || '',
          'Model Number': product.model || '',
          'Color': product.color || '',
          'Size': product.size || '',
          'Weight': product.weight || '',
          'Main Image URL': product.images?.[0]?.originalUrl || ''
        }

      case 'FACEBOOK':
        return {
          'Title': product.title || '',
          'Description': this.formatDescription(product.description || '', 'FACEBOOK'),
          'Price': product.lowestRecordedPrice || product.price || 0,
          'Availability': (product.quantity && product.quantity > 0) ? 'in stock' : 'out of stock',
          'Condition': product.condition || 'New',
          'Brand': product.brand || '',
          'Color': product.color || '',
          'Size': product.size || '',
          'Image Link': product.images?.[0]?.originalUrl || ''
        }

      case 'BASELINKER':
        return {
          'name': product.title || '',
          'description': product.description || '',
          'price': product.lowestRecordedPrice || product.price || 0,
          'quantity': product.quantity || 1,
          'ean': product.upc || product.ean || '',
          'sku': product.sku || product.id || '',
          'brand': product.brand || '',
          'model': product.model || '',
          'color': product.color || '',
          'size': product.size || '',
          'weight': product.weight || '',
          'dimensions': this.formatDimensions(product.dimensions),
          'images': this.formatImages(product.images)
        }

      default:
        // Generic format
        return {
          'Title': product.title || '',
          'Description': product.description || '',
          'Price': product.lowestRecordedPrice || product.price || 0,
          'Quantity': product.quantity || 1,
          'UPC': product.upc || '',
          'Brand': product.brand || '',
          'Model': product.model || '',
          'Condition': product.condition || 'New'
        }
    }
  }

  private formatDescription(description: string, marketplace: string): string {
    const config = getMarketplaceConfig(marketplace)
    if (!config?.fieldMapping?.description) {
      return description
    }

    let formatted = description

    // Remove HTML if not allowed
    if (!config.fieldMapping.description.allowHtml) {
      formatted = formatted.replace(/<[^>]*>/g, '')
    }

    // Truncate if exceeds max length
    if (config.fieldMapping.description.maxLength && formatted.length > config.fieldMapping.description.maxLength) {
      formatted = formatted.substring(0, config.fieldMapping.description.maxLength - 3) + '...'
    }

    return formatted
  }

  private formatImages(images?: Array<{ originalUrl?: string; url?: string }>): string {
    if (!images || images.length === 0) {
      return ''
    }
    
    return images
      .map(img => img.originalUrl || img.url)
      .filter(Boolean)
      .join(';')
  }

  private formatDimensions(dimensions?: { length?: number; width?: number; height?: number }): string {
    if (!dimensions) {
      return ''
    }
    
    const { length, width, height } = dimensions
    if (length && width && height) {
      return `${length} x ${width} x ${height}`
    }
    
    return ''
  }

  private getEbayCategory(product: any): string {
    // Default eBay category - you might want to implement category mapping logic here
    if (product.categories && product.categories.length > 0) {
      const ebayCategory = product.categories.find((cat: any) => cat.category?.type === 'ebay')
      if (ebayCategory) {
        return ebayCategory.category.categoryId
      }
    }
    
    // Default category for collectibles/toys
    return '220' // Toys & Hobbies > Action Figures
  }

  exportToCSV(options: CSVExportOptions): CSVExportResult {
    try {
      const { marketplace, products, customFields, filename, outputDir } = options
      
      if (!products || products.length === 0) {
        return {
          success: false,
          error: 'No products provided for export'
        }
      }

      const marketplaceUpper = marketplace.toUpperCase()
      const template = CSV_EXPORT_TEMPLATES[marketplaceUpper as keyof typeof CSV_EXPORT_TEMPLATES]
      
      // Determine headers
      let headers: string[]
      if (customFields && customFields.length > 0) {
        headers = customFields
      } else if (template) {
        headers = template.headers
      } else {
        // Fallback headers
        headers = ['Title', 'Description', 'Price', 'Quantity', 'UPC', 'Brand']
      }

      // Generate filename and path
      const exportFilename = this.generateFilename(marketplace, filename)
      const exportDir = outputDir || this.outputDir
      const filePath = join(exportDir, exportFilename)

      // Ensure export directory exists
      if (!existsSync(exportDir)) {
        mkdirSync(exportDir, { recursive: true })
      }

      // Convert products to CSV rows
      const csvRows: string[] = []
      
      // Add header row
      csvRows.push(headers.map(header => this.escapeCsvValue(header)).join(','))

      // Add data rows
      for (const product of products) {
        const mappedProduct = this.mapProductToCSVRow(product, marketplace)
        const row = headers.map(header => {
          const value = mappedProduct[header] ?? ''
          return this.escapeCsvValue(value)
        }).join(',')
        csvRows.push(row)
      }

      // Write CSV file
      const csvContent = csvRows.join('\n')
      writeFileSync(filePath, csvContent, 'utf8')

      return {
        success: true,
        filename: exportFilename,
        filePath: filePath,
        rowCount: products.length
      }

    } catch (error) {
      console.error('CSV Export Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      }
    }
  }

  // Utility method to get available export templates
  getAvailableTemplates(): Record<string, any> {
    return CSV_EXPORT_TEMPLATES
  }

  // Utility method to validate export options
  validateExportOptions(options: CSVExportOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!options.marketplace) {
      errors.push('Marketplace is required')
    }

    if (!options.products || options.products.length === 0) {
      errors.push('At least one product is required')
    }

    const config = getMarketplaceConfig(options.marketplace)
    if (!config) {
      errors.push(`Unsupported marketplace: ${options.marketplace}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}