import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import path from 'path'
import { fileURLToPath } from 'url'

// Dynamic import for the optimizer module
async function getMarketResearch(upc: string, productInfo?: any) {
  try {
    // Use dynamic import to load the CommonJS module
    const optimizerPath = path.join(process.cwd(), 'optimizer', 'upc-optimizer.js')
    const optimizer = require(optimizerPath)
    
    if (!optimizer.getMarketResearchByUPC) {
      throw new Error('Market research function not found in optimizer')
    }
    
    // Call the market research function
    const marketData = await optimizer.getMarketResearchByUPC(upc)
    
    // If we have additional product info, merge it with market data
    if (productInfo) {
      return {
        ...marketData,
        productInfo,
        mergedData: true
      }
    }
    
    return marketData
  } catch (error) {
    console.error('Error loading optimizer module:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Market Research API: Starting market research...')
    const body = await request.json()
    const { upc, productId, productInfo } = body

    if (!upc && !productId) {
      return NextResponse.json(
        { error: 'Either UPC or productId is required' },
        { status: 400 }
      )
    }

    let targetUpc = upc
    let fullProductInfo = productInfo || {}

    // If productId provided, fetch product details
    if (productId && !upc) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          offers: {
            orderBy: { price: 'asc' }
          },
          categories: {
            include: { category: true }
          }
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      targetUpc = product.upc
      fullProductInfo = {
        title: product.title || fullProductInfo.title,
        description: product.description || fullProductInfo.description,
        brand: product.brand || fullProductInfo.brand,
        price: product.lowestRecordedPrice || fullProductInfo.price,
        condition: product.condition || 'New',
        images: product.images.map(img => img.originalUrl).filter(Boolean),
        specifications: {
          UPC: product.upc,
          Brand: product.brand,
          Color: product.color,
          Size: product.size,
          Weight: product.weight ? `${product.weight}${product.weightUnit || 'g'}` : undefined
        },
        ...fullProductInfo
      }
    }

    console.log('Market Research API: Researching UPC:', targetUpc)

    // Get market research data
    const startTime = Date.now()
    const marketData = await getMarketResearch(targetUpc, fullProductInfo)
    const processingTime = Date.now() - startTime

    console.log('Market Research API: Research completed in', processingTime, 'ms')

    // Extract key insights
    const insights = {
      suggestedPrice: marketData.suggestedPrice || marketData.averagePrice,
      priceRange: marketData.priceRange || { min: 0, max: 0 },
      marketConfidence: marketData.confidence || 0,
      trend: marketData.trend || 'stable',
      competitorCount: marketData.similarListings?.length || 0,
      keywords: marketData.keywords || [],
      sellingPoints: marketData.sellingPoints || []
    }

    // Save market research to database (optional)
    if (productId) {
      try {
        await prisma.marketResearch.create({
          data: {
            productId,
            suggestedPrice: insights.suggestedPrice,
            priceRangeMin: insights.priceRange.min,
            priceRangeMax: insights.priceRange.max,
            marketConfidence: insights.marketConfidence,
            trend: insights.trend,
            competitorCount: insights.competitorCount,
            keywords: JSON.stringify(insights.keywords),
            sellingPoints: JSON.stringify(insights.sellingPoints),
            rawData: JSON.stringify(marketData),
            researchedAt: new Date()
          }
        })
      } catch (dbError) {
        console.warn('Market Research API: Could not save to database:', dbError)
        // Continue even if database save fails
      }
    }

    return NextResponse.json({
      success: true,
      upc: targetUpc,
      marketData,
      insights,
      processingTime
    })

  } catch (error) {
    console.error('Market Research API Error:', error)
    
    // Return mock data if optimizer fails
    return NextResponse.json({
      success: false,
      error: 'Market research temporarily unavailable',
      mockData: true,
      insights: {
        suggestedPrice: 29.99,
        priceRange: { min: 19.99, max: 39.99 },
        marketConfidence: 0.75,
        trend: 'stable',
        competitorCount: 5,
        keywords: ['quality', 'premium', 'bestseller'],
        sellingPoints: [
          'Competitive pricing',
          'High demand product',
          'Limited availability'
        ]
      }
    }, { status: 200 }) // Return 200 with mock data instead of error
  }
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

    // Check if we have cached market research
    const existingResearch = await prisma.marketResearch.findFirst({
      where: { 
        productId,
        researchedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Less than 24 hours old
        }
      },
      orderBy: { researchedAt: 'desc' }
    })

    if (existingResearch) {
      return NextResponse.json({
        success: true,
        cached: true,
        insights: {
          suggestedPrice: existingResearch.suggestedPrice,
          priceRange: {
            min: existingResearch.priceRangeMin,
            max: existingResearch.priceRangeMax
          },
          marketConfidence: existingResearch.marketConfidence,
          trend: existingResearch.trend,
          competitorCount: existingResearch.competitorCount,
          keywords: JSON.parse(existingResearch.keywords || '[]'),
          sellingPoints: JSON.parse(existingResearch.sellingPoints || '[]')
        },
        marketData: JSON.parse(existingResearch.rawData || '{}'),
        researchedAt: existingResearch.researchedAt
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No recent market research found. Please generate new research.',
      cached: false
    })

  } catch (error) {
    console.error('Error fetching market research:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market research' },
      { status: 500 }
    )
  }
}
