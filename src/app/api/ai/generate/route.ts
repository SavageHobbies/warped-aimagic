import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geminiService, type ProductData } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    console.log('AI Generation API: Starting AI content generation...')
    const body = await request.json()
    console.log('AI Generation API: Request body:', JSON.stringify(body, null, 2))
    const { productIds, regenerate = false } = body

    if (!productIds || !Array.isArray(productIds)) {
      console.error('AI Generation API: Invalid productIds:', productIds)
      return NextResponse.json(
        { error: 'productIds array is required' },
        { status: 400 }
      )
    }
    
    console.log('AI Generation API: Processing', productIds.length, 'products, regenerate:', regenerate)

    const results = []

    for (const productId of productIds) {
      try {
        console.log('AI Generation API: Processing product:', productId)
        
        // Check if AI content already exists and regenerate flag
        const existingContent = await prisma.aIContent.findUnique({
          where: { productId }
        })
        
        console.log('AI Generation API: Existing content status:', existingContent?.status || 'No existing content')

        if (existingContent && !regenerate) {
          console.log('AI Generation API: Skipping product (content exists, regenerate=false):', productId)
          results.push({
            productId,
            status: 'skipped',
            message: 'AI content already exists',
            content: existingContent
          })
          continue
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
            }
          }
        })

        if (!product) {
          console.error('AI Generation API: Product not found:', productId)
          results.push({
            productId,
            status: 'error',
            message: 'Product not found'
          })
          continue
        }
        
        console.log('AI Generation API: Found product:', product.title || product.upc)

        // Mark as processing
        await prisma.aIContent.upsert({
          where: { productId },
          create: {
            productId,
            status: 'processing'
          },
          update: {
            status: 'processing'
          }
        })

        // Prepare product data for Gemini
        const productData: ProductData = {
          upc: product.upc || 'NO_UPC',
          title: product.title || undefined,
          description: product.description || undefined,
          brand: product.brand || undefined,
          category: product.categories[0]?.category.fullPath || undefined,
          color: product.color || undefined,
          size: product.size || undefined,
          weight: product.weight ? `${product.weight}g` : undefined,
          lowestPrice: product.lowestRecordedPrice || undefined,
          highestPrice: product.highestRecordedPrice || undefined,
          offers: product.offers.map(offer => ({
            merchant: offer.merchant || 'Unknown',
            price: offer.price || undefined,
            condition: offer.condition || undefined
          })),
          images: product.images.map(img => img.originalUrl).filter(Boolean) as string[]
        }

        // Generate AI content
        console.log('AI Generation API: Calling Gemini service for product:', productId)
        console.log('AI Generation API: Product data:', JSON.stringify(productData, null, 2))
        
        const startTime = Date.now()
        const aiContent = await geminiService.generateProductContent(productData)
        const processingTime = Date.now() - startTime
        
        console.log('AI Generation API: Generated content:', JSON.stringify(aiContent, null, 2))
        console.log('AI Generation API: Processing time:', processingTime, 'ms')
        
        const modelInfo = geminiService.getModelInfo()
        console.log('AI Generation API: Model info:', modelInfo)

        // Save AI content to database
        const savedContent = await prisma.aIContent.upsert({
          where: { productId },
          create: {
            productId,
            seoTitle: aiContent.seoTitle,
            seoDescription: aiContent.shortDescription, // Use shortDescription
            productDescription: aiContent.productDescription,
            bulletPoints: JSON.stringify(aiContent.keyFeatures || []), // Use keyFeatures for bulletPoints
            tags: JSON.stringify(aiContent.tags || []),
            category: productData.category || 'General',
            specifications: JSON.stringify(aiContent.itemSpecifics || {}), // Use itemSpecifics for specifications
            marketingCopy: `eBay Title: ${aiContent.ebayTitle}\n\nUnique Selling Points:\n${(aiContent.uniqueSellingPoints || []).join('\n')}`,
            // New eBay-focused fields
            ebayTitle: aiContent.ebayTitle,
            shortDescription: aiContent.shortDescription,
            uniqueSellingPoints: JSON.stringify(aiContent.uniqueSellingPoints || []),
            keyFeatures: JSON.stringify(aiContent.keyFeatures || []),
            specificationsArray: JSON.stringify(aiContent.specifications || []),
            itemSpecifics: JSON.stringify(aiContent.itemSpecifics || {}),
            additionalAttributes: JSON.stringify(aiContent.additionalAttributes || {}),
            status: 'completed',
            aiModel: modelInfo.configured ? modelInfo.primary : 'mock',
            generatedAt: new Date(),
            processingTime
          },
          update: {
            seoTitle: aiContent.seoTitle,
            seoDescription: aiContent.shortDescription,
            productDescription: aiContent.productDescription,
            bulletPoints: JSON.stringify(aiContent.keyFeatures || []),
            tags: JSON.stringify(aiContent.tags || []),
            category: productData.category || 'General',
            specifications: JSON.stringify(aiContent.itemSpecifics || {}),
            marketingCopy: `eBay Title: ${aiContent.ebayTitle}\n\nUnique Selling Points:\n${(aiContent.uniqueSellingPoints || []).join('\n')}`,
            // New eBay-focused fields
            ebayTitle: aiContent.ebayTitle,
            shortDescription: aiContent.shortDescription,
            uniqueSellingPoints: JSON.stringify(aiContent.uniqueSellingPoints || []),
            keyFeatures: JSON.stringify(aiContent.keyFeatures || []),
            specificationsArray: JSON.stringify(aiContent.specifications || []),
            itemSpecifics: JSON.stringify(aiContent.itemSpecifics || {}),
            additionalAttributes: JSON.stringify(aiContent.additionalAttributes || {}),
            status: 'completed',
            aiModel: modelInfo.configured ? modelInfo.primary : 'mock',
            generatedAt: new Date(),
            processingTime,
            updatedAt: new Date()
          }
        })

        // Log the API call
        await prisma.apiLog.create({
          data: {
            service: 'gemini',
            endpoint: modelInfo.configured ? '/generateContent' : 'mock',
            method: 'POST',
            statusCode: 200,
            requestData: JSON.stringify({
              model: modelInfo.primary,
              productUpc: product.upc
            }),
            responseData: JSON.stringify({
              ebayTitle: aiContent.ebayTitle,
              seoTitle: aiContent.seoTitle,
              shortDescription: aiContent.shortDescription?.substring(0, 100) + '...',
              keyFeaturesCount: aiContent.keyFeatures?.length || 0,
              tagsCount: aiContent.tags?.length || 0,
              uniqueSellingPointsCount: aiContent.uniqueSellingPoints?.length || 0
            }),
            duration: processingTime
          }
        })

        results.push({
          productId,
          status: 'completed',
          content: savedContent,
          processingTime
        })

        // Add delay between requests to respect rate limits
        if (productIds.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (error) {
        console.error(`Error processing product ${productId}:`, error)
        
        // Mark as failed
        await prisma.aIContent.upsert({
          where: { productId },
          create: {
            productId,
            status: 'failed'
          },
          update: {
            status: 'failed',
            updatedAt: new Date()
          }
        })

        results.push({
          productId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: productIds.length,
        completed: results.filter(r => r.status === 'completed').length,
        errors: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length
      }
    })

  } catch (error) {
    console.error('Error in AI generation endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI content' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get AI generation status summary
    const products = await prisma.product.findMany({
      include: {
        aiContent: true
      }
    })

    const summary = {
      total: products.length,
      withAiContent: products.filter(p => p.aiContent).length,
      pending: products.filter(p => p.aiContent?.status === 'pending').length,
      processing: products.filter(p => p.aiContent?.status === 'processing').length,
      completed: products.filter(p => p.aiContent?.status === 'completed').length,
      failed: products.filter(p => p.aiContent?.status === 'failed').length,
      noContent: products.filter(p => !p.aiContent).length
    }

    const modelInfo = geminiService.getModelInfo()

    return NextResponse.json({
      summary,
      geminiConfig: {
        configured: modelInfo.configured,
        primaryModel: modelInfo.primary,
        fallbackModel: modelInfo.fallback
      }
    })

  } catch (error) {
    console.error('Error fetching AI generation status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AI generation status' },
      { status: 500 }
    )
  }
}
