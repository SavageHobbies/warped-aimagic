import { NextRequest, NextResponse } from 'next/server'
import { ebayService, EbayCategoryAspect } from '@/lib/ebay'
import { prisma } from '@/lib/prisma'

interface ProductAnalysisRequest {
  productId?: string
  title?: string
  brand?: string
  upc?: string
  category?: string
}

interface EbayAnalysisResult {
  suggestedCategory?: {
    categoryId: string
    categoryName: string
    confidence: number
  }
  requiredAspects: EbayCategoryAspect[]
  recommendedAspects: EbayCategoryAspect[]
  competitivePricing?: {
    averagePrice?: number
    lowestPrice?: number
    highestPrice?: number
    currency: string
    sampleSize: number
  }
  suggestedItemSpecifics?: { [key: string]: string[] }
}

export async function POST(request: NextRequest) {
  try {
    if (!ebayService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'eBay API not configured',
          message: 'eBay credentials are required for this functionality'
        },
        { status: 503 }
      )
    }

    const body: ProductAnalysisRequest = await request.json()
    
    let productData: { title?: string; brand?: string; upc?: string } = {}
    
    if (body.productId) {
      // Fetch product from database
      const product = await prisma.product.findUnique({
        where: { id: body.productId },
        include: {
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
      
      productData = {
        title: product.title || undefined,
        brand: product.brand || undefined,
        upc: product.upc || undefined
      }
    } else {
      productData = {
        title: body.title,
        brand: body.brand,
        upc: body.upc
      }
    }

    if (!productData.title) {
      return NextResponse.json(
        { error: 'Product title is required for analysis' },
        { status: 400 }
      )
    }

    const result: EbayAnalysisResult = {
      requiredAspects: [],
      recommendedAspects: []
    }

    // Step 1: Find best eBay category
    console.log('Finding best eBay category for:', productData.title)
    const suggestedCategory = await ebayService.findBestCategory(
      productData.title, 
      productData.brand
    )
    
    if (suggestedCategory) {
      result.suggestedCategory = suggestedCategory
      console.log('Suggested category:', suggestedCategory)

      // Step 2: Get category-specific aspects/requirements
      const categoryAspects = await ebayService.getCategoryAspects(suggestedCategory.categoryId)
      
      if (categoryAspects) {
        result.requiredAspects = categoryAspects.filter(
          aspect => aspect.aspectConstraint.aspectUsage === 'REQUIRED'
        )
        result.recommendedAspects = categoryAspects.filter(
          aspect => aspect.aspectConstraint.aspectUsage === 'RECOMMENDED'
        )
        
        console.log(`Found ${result.requiredAspects.length} required aspects and ${result.recommendedAspects.length} recommended aspects`)
      }

      // Step 3: Get competitive pricing
      const competitivePricing = await ebayService.getCompetitivePricing(
        productData.title,
        suggestedCategory.categoryId
      )
      
      if (competitivePricing) {
        result.competitivePricing = competitivePricing
        console.log('Competitive pricing found:', competitivePricing)
      }

      // Step 4: Get suggested item specifics from similar products
      const suggestedSpecifics = await ebayService.getItemSpecificsFromSimilarProducts(
        productData.title,
        suggestedCategory.categoryId
      )
      
      if (suggestedSpecifics) {
        result.suggestedItemSpecifics = suggestedSpecifics
      }
    }

    // Log the analysis
    await prisma.apiLog.create({
      data: {
        service: 'ebay',
        endpoint: '/api/ebay/analyze',
        method: 'POST',
        statusCode: 200,
        requestData: JSON.stringify({
          productId: body.productId,
          title: productData.title?.substring(0, 100),
          brand: productData.brand
        }),
        responseData: JSON.stringify({
          categoryFound: !!result.suggestedCategory,
          requiredAspects: result.requiredAspects.length,
          recommendedAspects: result.recommendedAspects.length,
          pricingFound: !!result.competitivePricing
        })
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error analyzing product for eBay:', error)
    
    // Log the error
    await prisma.apiLog.create({
      data: {
        service: 'ebay',
        endpoint: '/api/ebay/analyze',
        method: 'POST',
        statusCode: 500,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        responseData: JSON.stringify({ error: 'Failed to analyze product' })
      }
    })

    return NextResponse.json(
      { error: 'Failed to analyze product for eBay' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  
  if (!categoryId) {
    return NextResponse.json(
      { error: 'categoryId parameter is required' },
      { status: 400 }
    )
  }

  try {
    if (!ebayService.isConfigured()) {
      return NextResponse.json(
        { error: 'eBay API not configured' },
        { status: 503 }
      )
    }

    const aspects = await ebayService.getCategoryAspects(categoryId)
    
    if (!aspects) {
      return NextResponse.json(
        { error: 'Failed to fetch category aspects' },
        { status: 404 }
      )
    }

    const result = {
      categoryId,
      requiredAspects: aspects.filter(aspect => aspect.aspectConstraint.aspectUsage === 'REQUIRED'),
      recommendedAspects: aspects.filter(aspect => aspect.aspectConstraint.aspectUsage === 'RECOMMENDED'),
      optionalAspects: aspects.filter(aspect => aspect.aspectConstraint.aspectUsage === 'OPTIONAL'),
      totalAspects: aspects.length
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching eBay category aspects:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch category aspects' },
      { status: 500 }
    )
  }
}
