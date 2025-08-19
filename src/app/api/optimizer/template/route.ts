import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

// Dynamic import for the optimizer module
async function generateEbayTemplate(product: any, marketData?: any) {
  try {
    // Try to load the optimizer's template renderer
    const optimizerPath = path.join(process.cwd(), 'optimizer', 'src', 'services', 'TemplateRenderer.js')
    
    // Check if the file exists
    try {
      await fs.access(optimizerPath)
    } catch {
      console.log('TemplateRenderer not found, using fallback template')
      return generateFallbackTemplate(product, marketData)
    }

    const TemplateRenderer = require(optimizerPath)
    const renderer = new TemplateRenderer()
    
    // Prepare template data
    const templateData = {
      title: product.aiContent?.ebayTitle || product.title || `${product.brand} ${product.model}`.trim(),
      description: product.aiContent?.productDescription || product.description || '',
      brand: product.brand,
      model: product.model,
      upc: product.upc,
      condition: product.condition || 'New',
      images: product.images.map((img: any) => img.originalUrl).filter(Boolean),
      features: [],
      specifications: {},
      price: product.listingPrice || marketData?.suggestedPrice || 0,
      shipping: {
        handling_time: 1,
        shipping_service: 'USPS Priority Mail',
        shipping_cost: 0
      }
    }

    // Add features from AI content
    if (product.aiContent) {
      if (product.aiContent.keyFeatures) {
        templateData.features = product.aiContent.keyFeatures.split(',').map((f: string) => f.trim())
      }
      if (product.aiContent.ebayBulletPoints) {
        templateData.features.push(...product.aiContent.ebayBulletPoints.split('\n').filter(Boolean))
      }
    }

    // Add specifications
    if (product.color) templateData.specifications['Color'] = product.color
    if (product.size) templateData.specifications['Size'] = product.size
    if (product.weight) templateData.specifications['Weight'] = product.weight
    if (product.dimensions) templateData.specifications['Dimensions'] = product.dimensions
    if (product.material) templateData.specifications['Material'] = product.material
    if (product.mpn) templateData.specifications['MPN'] = product.mpn
    if (product.ageGroup) templateData.specifications['Age Group'] = product.ageGroup
    if (product.theme) templateData.specifications['Theme'] = product.theme
    if (product.character) templateData.specifications['Character'] = product.character

    // Generate HTML template
    const html = await renderer.renderTemplate(templateData, 'ebay')
    
    return html
  } catch (error) {
    console.error('Error generating template with optimizer:', error)
    return generateFallbackTemplate(product, marketData)
  }
}

// Fallback template generator
function generateFallbackTemplate(product: any, marketData?: any) {
  const title = product.aiContent?.ebayTitle || product.title || `${product.brand} ${product.model}`.trim()
  const description = product.aiContent?.productDescription || product.description || 'Product Description'
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .content { padding: 30px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .gallery img { width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 15px; }
        .features { list-style: none; }
        .features li { padding: 10px 0; border-bottom: 1px solid #eee; }
        .features li:before { content: "✓"; color: #667eea; font-weight: bold; margin-right: 10px; }
        .specs-table { width: 100%; border-collapse: collapse; }
        .specs-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .specs-table td:first-child { font-weight: bold; width: 40%; background: #f8f9fa; }
        .price-box { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .price { font-size: 36px; color: #667eea; font-weight: bold; }
        .shipping-info { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            ${product.brand ? `<p>by ${product.brand}</p>` : ''}
        </div>
        
        <div class="content">
            ${product.images && product.images.length > 0 ? `
            <div class="section">
                <h2>Product Images</h2>
                <div class="gallery">
                    ${product.images.slice(0, 6).map((img: any) => 
                        `<img src="${img.originalUrl}" alt="${title}" />`
                    ).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="section">
                <h2>Description</h2>
                <p style="line-height: 1.6; color: #555;">
                    ${description.replace(/\n/g, '<br>')}
                </p>
            </div>
            
            ${product.aiContent?.keyFeatures || product.aiContent?.ebayBulletPoints ? `
            <div class="section">
                <h2>Key Features</h2>
                <ul class="features">
                    ${product.aiContent.keyFeatures ? 
                        product.aiContent.keyFeatures.split(',').map((f: string) => 
                            `<li>${f.trim()}</li>`
                        ).join('') : ''}
                    ${product.aiContent.ebayBulletPoints ? 
                        product.aiContent.ebayBulletPoints.split('\n').filter(Boolean).map((f: string) => 
                            `<li>${f.trim()}</li>`
                        ).join('') : ''}
                </ul>
            </div>
            ` : ''}
            
            <div class="section">
                <h2>Specifications</h2>
                <table class="specs-table">
                    ${product.upc ? `<tr><td>UPC</td><td>${product.upc}</td></tr>` : ''}
                    ${product.brand ? `<tr><td>Brand</td><td>${product.brand}</td></tr>` : ''}
                    ${product.model ? `<tr><td>Model</td><td>${product.model}</td></tr>` : ''}
                    ${product.mpn ? `<tr><td>MPN</td><td>${product.mpn}</td></tr>` : ''}
                    ${product.color ? `<tr><td>Color</td><td>${product.color}</td></tr>` : ''}
                    ${product.size ? `<tr><td>Size</td><td>${product.size}</td></tr>` : ''}
                    ${product.weight ? `<tr><td>Weight</td><td>${product.weight}</td></tr>` : ''}
                    ${product.dimensions ? `<tr><td>Dimensions</td><td>${product.dimensions}</td></tr>` : ''}
                    ${product.material ? `<tr><td>Material</td><td>${product.material}</td></tr>` : ''}
                    ${product.condition ? `<tr><td>Condition</td><td>${product.condition}</td></tr>` : ''}
                    ${product.ageGroup ? `<tr><td>Age Group</td><td>${product.ageGroup}</td></tr>` : ''}
                    ${product.theme ? `<tr><td>Theme</td><td>${product.theme}</td></tr>` : ''}
                    ${product.character ? `<tr><td>Character</td><td>${product.character}</td></tr>` : ''}
                </table>
            </div>
            
            ${marketData?.suggestedPrice || product.listingPrice ? `
            <div class="price-box">
                <div class="price">$${(marketData?.suggestedPrice || product.listingPrice || 0).toFixed(2)}</div>
                <p style="color: #666; margin-top: 10px;">Best Value!</p>
            </div>
            ` : ''}
            
            <div class="shipping-info">
                <h3 style="margin-bottom: 10px;">📦 Shipping Information</h3>
                <p>✓ Fast & Secure Shipping</p>
                <p>✓ Ships within 1 business day</p>
                <p>✓ Tracking number provided</p>
                <p>✓ Carefully packaged for safe delivery</p>
            </div>
            
            ${product.aiContent?.uniqueSellingPoints ? `
            <div class="section">
                <h2>Why Buy From Us?</h2>
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px;">
                    ${product.aiContent.uniqueSellingPoints.split('\n').map((point: string) => 
                        `<p style="margin: 10px 0;">⭐ ${point.trim()}</p>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p style="margin-top: 10px; font-size: 12px;">
                Generated on ${new Date().toLocaleDateString()} | 
                100% Satisfaction Guaranteed
            </p>
        </div>
    </div>
</body>
</html>
  `
  
  return html
}

export async function POST(request: NextRequest) {
  try {
    console.log('Template API: Starting template generation...')
    const { productId, templateType = 'ebay' } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Fetch product with all related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          orderBy: { imageNumber: 'asc' }
        },
        offers: true,
        categories: {
          include: {
            category: true
          }
        },
        aiContent: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check for recent market research
    let marketData = null
    try {
      const marketResearch = await prisma.marketResearch.findFirst({
        where: { 
          productId,
          researchedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Less than 24 hours old
          }
        },
        orderBy: { researchedAt: 'desc' }
      })
      
      if (marketResearch) {
        marketData = {
          suggestedPrice: marketResearch.suggestedPrice,
          priceRange: {
            min: marketResearch.priceRangeMin,
            max: marketResearch.priceRangeMax
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch market research:', error)
    }

    console.log(`Template API: Generating ${templateType} template for product ${product.title || product.upc}`)

    // Generate the template
    const html = await generateEbayTemplate(product, marketData)

    // Return the HTML template
    return NextResponse.json({
      success: true,
      productId,
      productTitle: product.title || product.upc,
      templateType,
      hasMarketData: !!marketData,
      html
    })

  } catch (error) {
    console.error('Template API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
