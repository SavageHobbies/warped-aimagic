import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ebayService } from '@/lib/ebay'

const prisma = new PrismaClient()

// Helper functions for extracting product information
function extractCharacterFromTitle(title: string): string {
  // Common patterns for character names in titles
  const patterns = [
    /Funko Pop!?\s*([^#]+?)\s*#?\d*$/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*-/,
    /-\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*-/
  ]
  
  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return ''
}

function extractBrandFromTitle(title: string): string {
  const commonBrands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Forever 21', 'Gap', 'Old Navy', 'Target', 'Walmart']
  const titleUpper = title.toUpperCase()
  
  for (const brand of commonBrands) {
    if (titleUpper.includes(brand.toUpperCase())) {
      return brand
    }
  }
  return ''
}

function extractSizeFromProduct(product: any, aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  return product.size || 
         aiContent?.itemSpecifics?.Size ||
         aiContent?.specificationsArray?.find((s: any) => s.name.toLowerCase().includes('size'))?.value || // eslint-disable-line @typescript-eslint/no-explicit-any
         extractSizeFromText(product.title + ' ' + (aiContent?.description || '')) ||
         ''
}

function extractSizeFromText(text: string): string {
  const sizePatterns = [
    /\b(XS|S|M|L|XL|XXL|XXXL)\b/i,
    /\bSize:?\s*([XS|S|M|L|XL|XXL|XXXL|\d+])\b/i,
    /\b(\d{1,2})\b/  // Numeric sizes like 8, 10, 12
  ]
  
  for (const pattern of sizePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].toUpperCase()
    }
  }
  return ''
}

function extractColorFromProduct(product: any, aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  return product.color ||
         aiContent?.itemSpecifics?.Color ||
         aiContent?.specificationsArray?.find((s: any) => s.name.toLowerCase().includes('color'))?.value || // eslint-disable-line @typescript-eslint/no-explicit-any
         extractColorFromText(product.title + ' ' + (aiContent?.description || '')) ||
         ''
}

function extractColorFromText(text: string): string {
  const colors = [
    'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Black', 'White', 
    'Gray', 'Grey', 'Navy', 'Teal', 'Maroon', 'Burgundy', 'Olive', 'Lime', 'Aqua', 'Silver', 
    'Gold', 'Beige', 'Tan', 'Coral', 'Salmon', 'Turquoise', 'Lavender', 'Mint'
  ]
  
  const textUpper = text.toUpperCase()
  for (const color of colors) {
    if (textUpper.includes(color.toUpperCase())) {
      return color
    }
  }
  return ''
}

function extractStyleFromProduct(aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const styles = [
    'Casual', 'Formal', 'Business', 'Evening', 'Cocktail', 'Maxi', 'Mini', 'Midi',
    'A-Line', 'Bodycon', 'Shift', 'Wrap', 'Fit & Flare', 'Sheath', 'Tunic'
  ]
  
  if (aiContent?.keyFeatures) {
    const featuresText = aiContent.keyFeatures.join(' ').toUpperCase()
    for (const style of styles) {
      if (featuresText.includes(style.toUpperCase())) {
        return style
      }
    }
  }
  
  return ''
}

function extractDressLengthFromProduct(aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const lengths = ['Mini', 'Short', 'Knee-Length', 'Midi', 'Tea-Length', 'Maxi', 'Floor-Length']
  
  if (aiContent?.keyFeatures) {
    const featuresText = aiContent.keyFeatures.join(' ').toUpperCase()
    for (const length of lengths) {
      if (featuresText.includes(length.toUpperCase())) {
        return length
      }
    }
  }
  
  return ''
}

function extractSleeveLength(aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const sleeveLengths = ['Sleeveless', 'Short Sleeve', '3/4 Sleeve', 'Long Sleeve', 'Cap Sleeve']
  
  if (aiContent?.keyFeatures) {
    const featuresText = aiContent.keyFeatures.join(' ').toUpperCase()
    for (const length of sleeveLengths) {
      if (featuresText.includes(length.toUpperCase().replace(' ', '\\s*'))) {
        return length
      }
    }
  }
  
  return ''
}

function extractPatternFromDescription(description: string): string {
  const patterns = [
    'Solid', 'Striped', 'Polka Dot', 'Floral', 'Geometric', 'Animal Print', 'Plaid', 
    'Paisley', 'Abstract', 'Tie-Dye', 'Checkered', 'Camouflage'
  ]
  
  const descUpper = description.toUpperCase()
  for (const pattern of patterns) {
    if (descUpper.includes(pattern.toUpperCase())) {
      return pattern
    }
  }
  
  return ''
}

function extractSeasonFromProduct(aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'Year Round']
  
  if (aiContent?.keyFeatures) {
    const featuresText = aiContent.keyFeatures.join(' ').toUpperCase()
    for (const season of seasons) {
      if (featuresText.includes(season.toUpperCase())) {
        return season
      }
    }
  }
  
  return 'Year Round'
}

function extractOccasionFromProduct(aiContent: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const occasions = [
    'Casual', 'Business', 'Formal', 'Party', 'Wedding', 'Date Night', 'Work', 
    'Vacation', 'Everyday', 'Special Occasion'
  ]
  
  if (aiContent?.keyFeatures) {
    const featuresText = aiContent.keyFeatures.join(' ').toUpperCase()
    for (const occasion of occasions) {
      if (featuresText.includes(occasion.toUpperCase())) {
        return occasion
      }
    }
  }
  
  return ''
}

// Template configurations for different eBay categories
const TEMPLATE_CONFIGS = {
  'funko_toys_games_movies': {
    category: '149372', // Action Figures - Funko category
    requiredAspects: ['Type'],
    aspectValues: {
      'Type': 'Pop! Vinyl',
      'Brand': 'Funko',
      'Age Level': '8+',
      'Material': 'Vinyl',
      'Product Line': 'Pop!'
    }
  },
  'womens_apparel': {
    category: '63861', // Women's Dresses category  
    requiredAspects: ['Brand', 'Size', 'Size Type', 'Style', 'Dress Length', 'Color', 'Department'],
    aspectValues: {
      'Size Type': 'Regular',
      'Department': 'Women',
      'Style': 'Casual'
    }
  }
}

interface EBayListingData {
  title: string
  subtitle?: string
  description: string
  picURL: string
  quantity: number
  startPrice: number
  buyItNowPrice?: number
  brand?: string
  mpn?: string
  upc?: string
  ean?: string
  customLabel?: string
  itemSpecifics: Record<string, string>
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('\"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function formatItemSpecifics(specifics: Record<string, string>): string {
  const pairs = Object.entries(specifics)
    .filter(([, value]) => value && value.trim())
    .map(([key, value]) => `${key}:${value}`)
  return pairs.join(';')
}

function generateEBayCSV(products: any[], templateType: string, listingData: EBayListingData[], effectiveCategoryId?: string): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const config = TEMPLATE_CONFIGS[templateType as keyof typeof TEMPLATE_CONFIGS]
  if (!config) {
    throw new Error(`Unknown template type: ${templateType}`)
  }
  
  const categoryId = effectiveCategoryId || config.category

  // CSV Headers - this is the eBay bulk upload format
  const headers = [
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
    'PaymentMethods',
    'PayPalEmailAddress',
    'ShippingType',
    'ShippingService-1:Option',
    'ShippingService-1:Cost',
    'ShippingService-2:Option',
    'ShippingService-2:Cost',
    'ShippingService-3:Option',
    'ShippingService-3:Cost',
    'Location',
    'PostalCode',
    'DispatchTimeMax',
    'ReturnsAcceptedOption',
    'ReturnsWithinOption',
    'ShippingCostPaidByOption',
    'RefundOption',
    'Description',
    'Brand',
    'MPN',
    'UPC',
    'EAN',
    'ISBN',
    'EPID',
    'CustomLabel',
    'ItemSpecifics'
  ]

  let csv = headers.join(',') + '\n'

  // Generate rows for each product
  listingData.forEach(data => {
    const row = [
      'Add', // Action
      categoryId, // Category
      '1000', // ConditionID (1000 = New)
      escapeCSVField(data.title),
      escapeCSVField(data.subtitle || ''),
      escapeCSVField(data.picURL),
      data.quantity.toString(),
      data.startPrice.toString(),
      data.buyItNowPrice?.toString() || '',
      'GTC', // Duration (Good Till Cancelled)
      'PayPal', // PaymentMethods
      '', // PayPalEmailAddress (will be filled by eBay)
      'Flat', // ShippingType
      'USPS Priority Mail', // ShippingService-1:Option
      '7.95', // ShippingService-1:Cost
      'UPS Ground', // ShippingService-2:Option
      '9.95', // ShippingService-2:Cost
      'USPS First-Class Mail', // ShippingService-3:Option
      '4.95', // ShippingService-3:Cost
      '', // Location (will use account default)
      '', // PostalCode (will use account default)
      '1', // DispatchTimeMax (1 business day)
      'ReturnsAccepted', // ReturnsAcceptedOption
      'Days_30', // ReturnsWithinOption
      'Buyer', // ShippingCostPaidByOption
      'MoneyBack', // RefundOption
      escapeCSVField(data.description),
      escapeCSVField(data.brand || ''),
      escapeCSVField(data.mpn || ''),
      escapeCSVField(data.upc || ''),
      escapeCSVField(data.ean || ''),
      '', // ISBN
      '', // EPID
      escapeCSVField(data.customLabel || ''),
      escapeCSVField(formatItemSpecifics(data.itemSpecifics))
    ]
    
    csv += row.join(',') + '\n'
  })

  return csv
}

export async function POST(request: NextRequest) {
  try {
    console.log('eBay Export API: Starting export process...')
    const requestBody = await request.json()
    console.log('eBay Export API: Request body:', JSON.stringify(requestBody, null, 2))
    
    const { productIds, templateType, useDynamicCategories = false } = requestBody

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      console.error('eBay Export API: No products selected')
      return NextResponse.json({ error: 'No products selected' }, { status: 400 })
    }

    if (!templateType || !TEMPLATE_CONFIGS[templateType as keyof typeof TEMPLATE_CONFIGS]) {
      console.error('eBay Export API: Invalid template type:', templateType)
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
    }
    
    console.log('eBay Export API: Processing', productIds.length, 'products with template:', templateType)

    // Fetch products from database
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        images: true,
        aiContent: true,
        offers: {
          orderBy: { price: 'asc' }
        }
      }
    })

    if (products.length === 0) {
      console.error('eBay Export API: No products found in database for IDs:', productIds)
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }
    
    console.log('eBay Export API: Found', products.length, 'products in database')

    // If eBay API is configured and user wants dynamic categories, analyze products
    let dynamicCategoryData = null
    if (useDynamicCategories && ebayService.isConfigured()) {
      try {
        console.log('Using dynamic eBay category analysis...')
        const sampleProduct = products[0]
        if (sampleProduct.title) {
          const categoryAnalysis = await ebayService.findBestCategory(
            sampleProduct.title,
            sampleProduct.brand || undefined
          )
          
          if (categoryAnalysis) {
            const aspects = await ebayService.getCategoryAspects(categoryAnalysis.categoryId)
            if (aspects) {
              dynamicCategoryData = {
                categoryId: categoryAnalysis.categoryId,
                categoryName: categoryAnalysis.categoryName,
                confidence: categoryAnalysis.confidence,
                requiredAspects: aspects.filter(a => a.aspectConstraint.aspectUsage === 'REQUIRED'),
                recommendedAspects: aspects.filter(a => a.aspectConstraint.aspectUsage === 'RECOMMENDED')
              }
              console.log(`Found dynamic category: ${categoryAnalysis.categoryName} (${categoryAnalysis.categoryId}) with confidence ${categoryAnalysis.confidence}`)
            }
          }
        }
      } catch (error) {
        console.error('Failed to get dynamic eBay category, falling back to template:', error)
      }
    }

    // Convert products to eBay listing format
    const listingData: EBayListingData[] = await Promise.all(products.map(async product => {
      console.log('eBay Export API: Processing product:', product.id, 'UPC:', product.upc)
      const aiContent = Array.isArray(product.aiContent) ? product.aiContent[0] as any : product.aiContent as any || null // eslint-disable-line @typescript-eslint/no-explicit-any
      console.log('eBay Export API: AI content status:', aiContent?.status || 'No AI content')
      const lowestOffer = product.offers?.[0] || null
      
      // Use AI content if available, fallback to basic product data
      const title = aiContent?.ebayTitle || aiContent?.title || product.title || `${product.brand || ''} Product - UPC: ${product.upc}`.trim()
      const description = aiContent?.detailedDescription || aiContent?.description || product.description || 'Product description not available.'
      const picURL = product.images?.[0]?.originalUrl || ''
      
      // Enhanced pricing with competitive analysis if eBay API is available
      let basePrice = lowestOffer?.price || product.lowestRecordedPrice || 9.99
      
      if (ebayService.isConfigured()) {
        try {
          const competitivePricing = await ebayService.getCompetitivePricing(
            product.title || '',
            dynamicCategoryData?.categoryId
          )
          if (competitivePricing?.averagePrice && competitivePricing.sampleSize > 5) {
            basePrice = competitivePricing.averagePrice
            console.log(`Using competitive pricing for ${product.title}: $${basePrice} (based on ${competitivePricing.sampleSize} samples)`)
          }
        } catch (error) {
          console.error('Failed to get competitive pricing, using fallback:', error)
        }
      }
      
      const startPrice = Math.max(basePrice * 0.8, 0.99) // Start 20% below market price, minimum $0.99
      const buyItNowPrice = basePrice * 1.2 // Buy it now at 20% above market price

      // Build item specifics based on dynamic category or template
      let itemSpecifics: Record<string, string> = {}
      
      if (dynamicCategoryData) {
        // Use dynamic eBay category requirements
        console.log(`Building item specifics for dynamic category: ${dynamicCategoryData.categoryName}`)
        
        // Start with required aspects
        dynamicCategoryData.requiredAspects.forEach(aspect => {
          const aspectName = aspect.localizedAspectName
          let value = ''
          
          // Map common aspects to product data
          switch (aspectName.toLowerCase()) {
            case 'brand':
              value = product.brand || aiContent?.itemSpecifics?.Brand || ''
              break
            case 'condition':
              value = 'New'
              break
            case 'upc':
              value = product.upc || ''
              break
            case 'color':
            case 'colour':
              value = extractColorFromProduct(product, aiContent)
              break
            case 'size':
              value = extractSizeFromProduct(product, aiContent)
              break
            case 'material':
              value = aiContent?.itemSpecifics?.Material || 'Unknown'
              break
            case 'type':
              if (dynamicCategoryData.categoryName.toLowerCase().includes('funko')) {
                value = 'Pop! Vinyl'
              }
              break
            case 'character':
              value = extractCharacterFromTitle(title)
              break
            default:
              // Try to extract from AI content
              value = aiContent?.itemSpecifics?.[aspectName] ||
                     aiContent?.additionalAttributes?.[aspectName] ||
                     ''
          }
          
          if (value) {
            itemSpecifics[aspectName] = value
          }
        })
        
        // Add recommended aspects if we have data
        dynamicCategoryData.recommendedAspects.forEach(aspect => {
          const aspectName = aspect.localizedAspectName
          if (!itemSpecifics[aspectName]) {
            const value = aiContent?.itemSpecifics?.[aspectName] ||
                         aiContent?.additionalAttributes?.[aspectName] ||
                         ''
            if (value) {
              itemSpecifics[aspectName] = value
            }
          }
        })
        
      } else {
        // Fall back to static template logic
      
      if (templateType === 'funko_toys_games_movies') {
        console.log('eBay Export API: Processing Funko template for product:', product.id)
        
        // Parse AI content fields that are stored as JSON strings
        const uniqueSellingPoints = aiContent?.uniqueSellingPoints ? 
          (typeof aiContent.uniqueSellingPoints === 'string' ? 
            JSON.parse(aiContent.uniqueSellingPoints) : aiContent.uniqueSellingPoints) : []
        const keyFeatures = aiContent?.keyFeatures ? 
          (typeof aiContent.keyFeatures === 'string' ? 
            JSON.parse(aiContent.keyFeatures) : aiContent.keyFeatures) : []
            
        console.log('eBay Export API: Parsed uniqueSellingPoints:', uniqueSellingPoints)
        console.log('eBay Export API: Parsed keyFeatures:', keyFeatures)
        
        // Map data to Funko category aspects based on the actual template
        itemSpecifics = {
          'Type': 'Pop! Vinyl',
          'Brand': 'Funko',
          'Exclusive Event/Retailer': Array.isArray(uniqueSellingPoints) ? 
            uniqueSellingPoints.find((p: string) => p.toLowerCase().includes('exclusive'))?.replace(/exclusive/i, '').trim() || '' : '',
          'Franchise': Array.isArray(keyFeatures) ? 
            keyFeatures.find((f: string) => f.toLowerCase().includes('franchise'))?.split(':')[1]?.trim() || 
            keyFeatures.find((f: string) => f.toLowerCase().includes('series'))?.split(':')[1]?.trim() || '' : '',
          'Character': Array.isArray(keyFeatures) ? 
            keyFeatures.find((f: string) => f.toLowerCase().includes('character'))?.split(':')[1]?.trim() || 
            extractCharacterFromTitle(title) || '' : extractCharacterFromTitle(title) || '',
          'Theme': Array.isArray(keyFeatures) ? 
            keyFeatures.find((f: string) => f.toLowerCase().includes('theme'))?.split(':')[1]?.trim() || '' : '',
          'TV/Streaming Show': Array.isArray(keyFeatures) ? 
            keyFeatures.find((f: string) => f.toLowerCase().includes('show'))?.split(':')[1]?.trim() || '' : '',
          'Movie': Array.isArray(keyFeatures) ? 
            keyFeatures.find((f: string) => f.toLowerCase().includes('movie'))?.split(':')[1]?.trim() || '' : '',
          'Features': Array.isArray(keyFeatures) ? keyFeatures.join(', ') || '' : '',
          'Age Level': '8+',
          'Size': 'Standard',
          'Material': 'Vinyl',
          'Product Line': 'Pop!',
          'Package Type': 'Window Box',
          'Recommended Age Range': '8+',
          'Year Manufactured': new Date().getFullYear().toString()
        }
      } else if (templateType === 'womens_apparel') {
        // Map data to Women's Apparel category aspects based on the actual template
        const extractedSize = extractSizeFromProduct(product, aiContent)
        const extractedColor = extractColorFromProduct(product, aiContent)
        
        itemSpecifics = {
          'Brand': product.brand || extractBrandFromTitle(title) || '',
          'Size': extractedSize,
          'Size Type': 'Regular',
          'Style': extractStyleFromProduct(aiContent) || 'Casual',
          'Dress Length': extractDressLengthFromProduct(aiContent),
          'Color': extractedColor,
          'Department': 'Women',
          'Material': aiContent?.specificationsArray?.find((s: any) => s.name === 'Material')?.value || // eslint-disable-line @typescript-eslint/no-explicit-any
                     aiContent?.keyFeatures?.find((f: string) => f.toLowerCase().includes('material'))?.split(':')[1]?.trim() || '',
          'Sleeve Length': aiContent?.itemSpecifics?.['Sleeve Length'] || extractSleeveLength(aiContent) || '',
          'Neckline': aiContent?.itemSpecifics?.Neckline || '',
          'Pattern': aiContent?.itemSpecifics?.Pattern || extractPatternFromDescription(description) || 'Solid',
          'Season': extractSeasonFromProduct(aiContent),
          'Occasion': extractOccasionFromProduct(aiContent) || 'Casual',
          'Features': aiContent?.keyFeatures?.join(', ') || ''
        }
      } // End of static template logic
      } // End of dynamic vs static choice

      return {
        title: title.substring(0, 80), // eBay title limit
        subtitle: aiContent?.shortDescription?.substring(0, 55) || '', // eBay subtitle limit
        description,
        picURL,
        quantity: product.quantity,
        startPrice: Number(startPrice.toFixed(2)),
        buyItNowPrice: Number(buyItNowPrice.toFixed(2)),
        brand: product.brand || '',
        mpn: product.model || '',
        upc: product.upc || '',
        ean: product.ean || '',
        customLabel: `INV-${product.id}`,
        itemSpecifics
      }
    }))

    // Generate CSV content using the appropriate category
    const effectiveCategoryId = dynamicCategoryData?.categoryId || TEMPLATE_CONFIGS[templateType as keyof typeof TEMPLATE_CONFIGS].category
    console.log('eBay Export API: Using category ID:', effectiveCategoryId)
    
    const csvContent = generateEBayCSV(products, templateType, listingData, effectiveCategoryId)
    console.log('eBay Export API: Generated CSV with', csvContent.split('\n').length - 1, 'rows')

    // Return CSV content
    const response = new NextResponse(csvContent)
    response.headers.set('Content-Type', 'text/csv')
    response.headers.set('Content-Disposition', `attachment; filename="ebay_listings_${templateType}_${Date.now()}.csv"`)
    
    console.log('eBay Export API: Export completed successfully')
    return response

  } catch (error) {
    console.error('eBay Export API: Error generating eBay export:', error)
    console.error('eBay Export API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Failed to generate eBay export',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  try {
    // Return available templates
    const templates = Object.keys(TEMPLATE_CONFIGS).map(key => ({
      id: key,
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: TEMPLATE_CONFIGS[key as keyof typeof TEMPLATE_CONFIGS].category,
      requiredAspects: TEMPLATE_CONFIGS[key as keyof typeof TEMPLATE_CONFIGS].requiredAspects
    }))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}
