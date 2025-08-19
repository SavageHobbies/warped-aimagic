import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CSV utility functions
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }
  let str = String(field);

  // Check for characters that require the field to be quoted
  const needsQuotes = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');
  
  // Handle CSV injection protection by prepending a single quote
  if (str.match(/^[=+\-@]/)) {
    str = `'${str}`;
  }
  
  // If quoting is needed (either due to special characters or because we added an injection protector)
  if (needsQuotes || str.startsWith("'")) {
    // Escape any double quotes within the string by doubling them
    const escapedStr = str.replace(/"/g, '""');
    // Enclose the entire field in double quotes
    return `"${escapedStr}"`;
  }

  return str;
}

function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '0.00'
  return price.toFixed(2)
}

function formatDate(date: Date | string | null | undefined, timezone?: string): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

function formatWeight(weight: string | number | null | undefined, unit: string = 'kg'): string {
  if (!weight) return '0'
  const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight
  if (unit === 'kg') {
    return (weightNum / 1000).toFixed(3) // Assuming weight is stored in grams
  }
  return weightNum.toFixed(3)
}

// Mapper interfaces
interface ExportMapper {
  name: string
  headers(): string[]
  map(product: any, options: any): (string | number | null)[]
  validate?(product: any): void
}

// CPI Mapper
class CPIMapper implements ExportMapper {
  name = 'cpi'
  
  headers(): string[] {
    return [
      'SKU',
      'Title',
      'Purchase Price',
      'List Price',
      'Quantity',
      'Category',
      'Supplier',
      'Location',
      'Barcode',
      'Weight (kg)',
      'Currency',
      'Last Updated',
      'Notes'
    ]
  }
  
  map(product: any, options: any): (string | number | null)[] {
    return [
      product.id || product.sku || '',
      product.title || '',
      formatPrice(product.msrp || 0),
      formatPrice(product.currentPrice || 0),
      product.quantity || 0,
      product.categories?.[0]?.category?.name || '',
      product.supplier || '',
      product.location || 'Main Warehouse',
      product.ean || product.upc || '',
      formatWeight(product.weight),
      options.currency || 'USD',
      formatDate(product.updatedAt || product.lastScanned, options.timezone),
      product.notes || ''
    ]
  }
  
  validate(product: any): void {
    if (!product.id && !product.sku) {
      throw new Error('Product must have SKU or ID')
    }
    if (!product.title) {
      throw new Error('Product must have a title')
    }
  }
}

// Baselinker Mapper
class BaselinkerMapper implements ExportMapper {
  name = 'baselinker'
  
  headers(): string[] {
    return [
      'Product name',
      'SKU',
      'EAN',
      'UPC',
      'Price',
      'Stock',
      'Weight',
      'Description',
      'Category',
      'Manufacturer',
      'Tax rate (%)',
      'Images'
    ]
  }
  
  map(product: any, options: any): (string | number | null)[] {
    // Get first 5 image URLs
    const imageUrls = product.images
      ?.slice(0, 5)
      .map((img: any) => img.originalUrl)
      .filter(Boolean)
      .join(';') || ''
    
    // Sanitize HTML from description
    let description = (product.description || '')
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    if (description.length > 5000) {
      description = description.substring(0, 4997) + '...';
    }
    
    return [
      product.title || '',
      product.id || product.sku || '',
      product.ean || '',
      product.upc || '',
      formatPrice(product.listingPrice || product.price || 0),
      product.quantity || 0,
      formatWeight(product.weight),
      description,
      product.categories?.[0]?.category?.name || '',
      product.brand || product.manufacturer || '',
      product.taxRate || '23', // Default VAT rate
      imageUrls
    ]
  }
  
  validate(product: any): void {
    if (!product.title) {
      throw new Error('Product must have a name')
    }
    if (!product.id && !product.sku) {
      throw new Error('Product must have SKU')
    }
  }
}

// eBay Mapper (wrapper for existing functionality)
class EbayMapper implements ExportMapper {
  name = 'ebay'
  
  headers(): string[] {
    return [
      'Action(SiteID=US|Country=US|Currency=USD|Version=1193|CC=UTF-8)',
      'Category',
      'ConditionID',
      'Title',
      'SubTitle',
      'PicURL',
      'Quantity',
      'StartPrice',
      'BuyItNowPrice',
      'Duration',
      'Brand',
      'MPN',
      'UPC',
      'EAN',
      'CustomLabel',
      'ItemSpecifics'
    ]
  }
  
  map(product: any, options: any): (string | number | null)[] {
    const aiContent = product.aiContent
    const title = aiContent?.ebayTitle || product.title || `Product - UPC: ${product.upc}`
    const subtitle = aiContent?.shortDescription || ''
    const picURL = product.images?.[0]?.originalUrl || ''
    
    // Pricing logic
    const basePrice = product.listingPrice || product.lowestRecordedPrice || 9.99
    const startPrice = Math.max(basePrice * 0.8, 0.99)
    const buyItNowPrice = basePrice * 1.2
    
    // Build item specifics
    const itemSpecifics: Record<string, string> = {
      'Brand': product.brand || 'Unbranded',
      'Type': product.type || 'General',
      'Condition': 'New'
    }
    
    if (product.color) itemSpecifics['Color'] = product.color
    if (product.size) itemSpecifics['Size'] = product.size
    if (product.material) itemSpecifics['Material'] = product.material
    
    const itemSpecificsStr = Object.entries(itemSpecifics)
      .map(([key, value]) => `${key}:${value}`)
      .join(';')
    
    return [
      'Add',
      options.categoryId || '20081', // Default "Other" category
      '1000', // New condition
      title.substring(0, 80),
      subtitle.substring(0, 55),
      picURL,
      product.quantity || 1,
      formatPrice(startPrice),
      formatPrice(buyItNowPrice),
      'GTC', // Good Till Cancelled
      product.brand || '',
      product.mpn || product.model || '',
      product.upc || '',
      product.ean || '',
      `INV-${product.id}`,
      itemSpecificsStr
    ]
  }
}

// Mapper factory
function getMapper(format: string): ExportMapper {
  switch (format) {
    case 'cpi':
      return new CPIMapper()
    case 'baselinker':
      return new BaselinkerMapper()
    case 'ebay':
      return new EbayMapper()
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// Generate CSV content
function generateCSV(
  products: any[],
  mapper: ExportMapper,
  options: any
): string {
  const includeHeaders = options.includeHeaders !== false
  const delimiter = options.delimiter || ','
  const excelFriendly = options.excelFriendly === true
  const lineEnding = excelFriendly ? '\r\n' : '\n'
  
  let csv = ''
  
  // Add BOM for Excel compatibility
  if (excelFriendly) {
    csv = '\uFEFF'
  }
  
  // Add headers
  if (includeHeaders) {
    const headers = mapper.headers().map(h => escapeCSVField(h))
    csv += headers.join(delimiter) + lineEnding
  }
  
  // Add data rows
  for (const product of products) {
    try {
      // Validate product if validator exists
      if (mapper.validate) {
        mapper.validate(product)
      }
      
      // Map product data
      const row = mapper.map(product, options)
      const escapedRow = row.map(field => escapeCSVField(field))
      csv += escapedRow.join(delimiter) + lineEnding
    } catch (error) {
      console.error(`Error processing product ${product.id}:`, error)
      // Skip invalid products or throw based on options
      if (options.strict) {
        throw error
      }
    }
  }
  
  return csv
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { format, selection, options = {} } = body
    
    // Validate format
    if (!format || !['cpi', 'baselinker', 'ebay'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be one of: cpi, baselinker, ebay' },
        { status: 400 }
      )
    }
    
    // Build query based on selection
    let whereClause: any = {}
    
    if (selection?.ids && Array.isArray(selection.ids)) {
      whereClause.id = { in: selection.ids }
    } else if (selection?.filters) {
      const filters = selection.filters;
      whereClause.AND = [];

      if (filters.search) {
        whereClause.AND.push({
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { upc: { contains: filters.search, mode: 'insensitive' } },
            { brand: { contains: filters.search, mode: 'insensitive' } },
          ],
        });
      }

      if (filters.condition) {
        whereClause.AND.push({ condition: filters.condition });
      }

      if (filters.minStock !== undefined) {
        whereClause.AND.push({ quantity: { gte: filters.minStock } });
      }
      
      if (filters.maxStock !== undefined) {
        whereClause.AND.push({ quantity: { lte: filters.maxStock } });
      }

      if (filters.categoryId) {
        whereClause.AND.push({
          categories: { some: { categoryId: filters.categoryId } },
        });
      }

      if (filters.updatedAfter) {
        whereClause.AND.push({ updatedAt: { gte: new Date(filters.updatedAfter) } });
      }
    }
    
    // Fetch products with related data
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: {
          orderBy: { imageNumber: 'asc' }
        },
        categories: {
          include: { category: true }
        },
        aiContent: true,
        offers: {
          orderBy: { price: 'asc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: options.maxRows || 50000 // Default max 50k rows for sync export
    })
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found matching the criteria' },
        { status: 404 }
      )
    }
    
    // Get mapper for the format
    const mapper = getMapper(format)
    
    // Generate CSV content
    const csvContent = generateCSV(products, mapper, options)
    
    // Create response with appropriate headers
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
    const filename = `inventory_${format}_${timestamp}.csv`
    
    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv; charset=utf-8')
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Cache-Control', 'no-cache')
    
    return response
    
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate export',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to retrieve available formats and their options
export async function GET() {
  return NextResponse.json({
    formats: [
      {
        id: 'cpi',
        name: 'CPI Sheet',
        description: 'Internal CPI format for inventory management',
        headers: new CPIMapper().headers()
      },
      {
        id: 'baselinker',
        name: 'Baselinker',
        description: 'Baselinker marketplace integration format',
        headers: new BaselinkerMapper().headers()
      },
      {
        id: 'ebay',
        name: 'eBay',
        description: 'eBay bulk listing upload format',
        headers: new EbayMapper().headers()
      }
    ],
    options: {
      currency: ['USD', 'EUR', 'GBP', 'PLN'],
      delimiter: [',', ';'],
      priceSource: ['list', 'sale', 'computed'],
      timezone: ['UTC', 'America/New_York', 'Europe/Warsaw']
    }
  })
}
