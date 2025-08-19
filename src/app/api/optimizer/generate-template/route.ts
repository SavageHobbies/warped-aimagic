import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

// Dynamic import for the optimizer module
async function generateEbayTemplate(upc: string, productInfo: any) {
  try {
    // Use dynamic import to load the CommonJS module
    const optimizerPath = path.join(process.cwd(), 'optimizer', 'upc-optimizer.js')
    const optimizer = require(optimizerPath)
    
    if (!optimizer.optimizeByUPC) {
      throw new Error('Template generation function not found in optimizer')
    }
    
    // Call the optimization function which includes template generation
    const result = await optimizer.optimizeByUPC(upc, productInfo)
    
    return result
  } catch (error) {
    console.error('Error loading optimizer module:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Template Generation API: Starting template generation...')
    const body = await request.json()
    const { productId, includeMarketData = true, templateStyle = 'professional' } = body

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Fetch product with all related data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        offers: {
          orderBy: { price: 'asc' }
        },
        categories: {
          include: { category: true }
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

    console.log('Template Generation API: Found product:', product.title || product.upc)

    // Prepare product info for template generation
    const productInfo = {
      title: product.title || 'Quality Product',
      description: product.description || '',
      price: product.lowestRecordedPrice || 0,
      brand: product.brand || 'Premium Brand',
      model: product.model || product.upc,
      color: product.color || '',
      size: product.size || '',
      weight: product.weight ? `${product.weight}${product.weightUnit || 'g'}` : '',
      condition: product.condition || 'New',
      quantity: product.quantity || 1,
      images: product.images.map(img => img.originalUrl).filter(Boolean),
      specifications: {
        UPC: product.upc,
        Brand: product.brand,
        Model: product.model,
        Color: product.color,
        Size: product.size,
        Weight: product.weight ? `${product.weight}${product.weightUnit || 'g'}` : undefined
      },
      seller: 'Professional Seller',
      location: 'USA'
    }

    // If AI content exists, use it to enhance the template
    if (product.aiContent) {
      productInfo.title = product.aiContent.ebayTitle || productInfo.title
      productInfo.description = product.aiContent.productDescription || productInfo.description
      
      // Parse JSON fields
      try {
        const keyFeatures = JSON.parse(product.aiContent.keyFeatures || '[]')
        const uniqueSellingPoints = JSON.parse(product.aiContent.uniqueSellingPoints || '[]')
        const itemSpecifics = JSON.parse(product.aiContent.itemSpecifics || '{}')
        
        productInfo.keyFeatures = keyFeatures
        productInfo.uniqueSellingPoints = uniqueSellingPoints
        productInfo.specifications = {
          ...productInfo.specifications,
          ...itemSpecifics
        }
      } catch (parseError) {
        console.warn('Template Generation API: Could not parse AI content:', parseError)
      }
    }

    console.log('Template Generation API: Generating template for UPC:', product.upc)

    // Generate the template
    const startTime = Date.now()
    const result = await generateEbayTemplate(product.upc, productInfo)
    const processingTime = Date.now() - startTime

    console.log('Template Generation API: Template generated in', processingTime, 'ms')

    // Extract the HTML and summary
    const { html, summary, marketData, product: optimizedContent } = result

    // Save the generated template (optional)
    const templatePath = path.join(process.cwd(), 'generated-templates', `${product.upc}-template.html`)
    try {
      await fs.mkdir(path.dirname(templatePath), { recursive: true })
      await fs.writeFile(templatePath, html, 'utf-8')
      console.log('Template Generation API: Template saved to:', templatePath)
    } catch (saveError) {
      console.warn('Template Generation API: Could not save template file:', saveError)
    }

    // Return the template and related data
    return NextResponse.json({
      success: true,
      productId,
      upc: product.upc,
      html,
      summary,
      optimizedContent,
      marketData: includeMarketData ? marketData : undefined,
      templatePath: `generated-templates/${product.upc}-template.html`,
      processingTime
    })

  } catch (error) {
    console.error('Template Generation API Error:', error)
    
    // Return a basic template if optimizer fails
    return NextResponse.json({
      success: false,
      error: 'Template generation temporarily unavailable',
      mockTemplate: true,
      html: generateFallbackTemplate(),
      summary: 'Basic template generated due to service unavailability'
    }, { status: 200 })
  }
}

function generateFallbackTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Listing</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1e88e5, #1565c0);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
        }
        .price {
            font-size: 2em;
            color: #2e7d32;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
        }
        .features {
            margin: 30px 0;
        }
        .features ul {
            list-style-type: none;
            padding: 0;
        }
        .features li {
            background-color: #f5f5f5;
            margin: 10px 0;
            padding: 12px;
            border-radius: 5px;
            border-left: 4px solid #1e88e5;
        }
        .cta {
            background: #4caf50;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            font-size: 1.2em;
            cursor: pointer;
            display: block;
            margin: 30px auto;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Premium Quality Product</h1>
        </div>
        
        <div class="price">Contact for Pricing</div>
        
        <div class="features">
            <h2>Key Features</h2>
            <ul>
                <li>High-quality construction</li>
                <li>Reliable performance</li>
                <li>Excellent value for money</li>
                <li>Fast shipping available</li>
                <li>Satisfaction guaranteed</li>
            </ul>
        </div>
        
        <button class="cta">Add to Cart - Buy Now!</button>
        
        <p style="text-align: center; margin-top: 30px; color: #666;">
            Template generation service temporarily unavailable. 
            Please try again later for a fully optimized listing.
        </p>
    </div>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Check if we have a generated template file
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { upc: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const templatePath = path.join(process.cwd(), 'generated-templates', `${product.upc}-template.html`)
    
    try {
      const html = await fs.readFile(templatePath, 'utf-8')
      return NextResponse.json({
        success: true,
        html,
        templatePath: `generated-templates/${product.upc}-template.html`,
        cached: true
      })
    } catch (readError) {
      return NextResponse.json({
        success: false,
        message: 'No template found. Please generate a new template.',
        cached: false
      })
    }

  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
