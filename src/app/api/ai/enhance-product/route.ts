import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geminiService, type ProductData } from '@/lib/gemini'
import { productDataService, type ExternalProductData } from '@/lib/productDataService'
import { conductMarketResearch } from '@/lib/marketResearchService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, includeMarketResearch = true, includePricing = true } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Fetch product with all related data including market research
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
        aiContent: true,
        marketResearch: {
          orderBy: { researchedAt: 'desc' },
          take: 1
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    console.log(`🤖 Comprehensively enhancing product: ${product.title}`)

    // Step 1: Fetch comprehensive external product data if UPC is available
    let externalData: ExternalProductData | null = null
    if (product.upc && product.upc !== 'NO_UPC') {
      try {
        console.log(`🔍 Fetching comprehensive external data for UPC: ${product.upc}`)
        externalData = await productDataService.fetchProductData(product.upc)
        
        if (externalData) {
          console.log(`✅ External data fetched for ${product.upc}:`, {
            source: externalData.source,
            fields: Object.keys(externalData).filter(k => externalData && (externalData as any)[k] && k !== 'source')
          })
        }
      } catch (error) {
        console.log(`ℹ️ No external data found for UPC ${product.upc}:`, error)
      }
    }

    // Step 2: Conduct market research if requested
    let marketResearch = null
    if (includeMarketResearch) {
      try {
        console.log(`📊 Conducting market research for: ${product.title}`)
        marketResearch = await conductMarketResearch({
          productId: product.id,
          upc: product.upc,
          productInfo: {
            title: product.title,
            brand: product.brand,
            price: product.lowestRecordedPrice
          }
        })
        if (marketResearch) {
          console.log(`📈 Market research completed:`, marketResearch.insights)
        }
      } catch (error) {
        console.log(`ℹ️ Market research unavailable:`, error)
      }
    }

    // Step 3: Prepare comprehensive product data for AI
    const productData: ProductData = {
      upc: product.upc || 'NO_UPC',
      title: product.title || undefined,
      description: product.description || undefined,
      brand: product.brand || externalData?.brand || undefined,
      category: product.categories[0]?.category.fullPath || externalData?.category || undefined,
      color: product.color || externalData?.color || undefined,
      size: product.size || externalData?.size || undefined,
      weight: product.weight != null ? `${product.weight}g` : (externalData?.weight != null ? `${externalData.weight}${externalData.weightUnit || 'g'}` : undefined),
      lowestPrice: product.lowestRecordedPrice || undefined,
      highestPrice: product.highestRecordedPrice || undefined,
      offers: product.offers.map(offer => ({
        merchant: offer.merchant || 'Unknown',
        price: offer.price || undefined,
        condition: offer.condition || undefined
      })),
      images: product.images.map(img => img.originalUrl).filter(Boolean) as string[]
      // Note: We explicitly handle external data fields above rather than spreading to avoid type conflicts
    }

    try {
      console.log('🤖 Generating comprehensive AI content...')
      const startTime = Date.now()
      
      // Generate comprehensive AI content using the full product data
      const aiContent = await geminiService.generateProductContent(productData)
      const processingTime = Date.now() - startTime
      
      console.log('✅ AI Enhancement Response:', {
        ebayTitle: aiContent.ebayTitle,
        seoTitle: aiContent.seoTitle,
        keyFeaturesCount: aiContent.keyFeatures?.length || 0,
        tagsCount: aiContent.tags?.length || 0
      })
      
      // Step 4: Prepare enhanced content with comprehensive external and market data
      const enhancedContent = {
        title: aiContent.ebayTitle || aiContent.seoTitle || product.title,
        description: aiContent.productDescription || product.description || `Enhanced ${product.title} in ${product.condition} condition.`,
        
        // Basic Product Fields
        brand: externalData?.brand || product.brand,
        model: externalData?.model || product.model,
        mpn: externalData?.mpn || product.mpn,
        sku: externalData?.sku || product.sku,
        
        // Physical Attributes - Universal
        color: externalData?.color || product.color,
        size: externalData?.size || product.size,
        weight: externalData?.weight || product.weight,
        weightUnit: externalData?.weightUnit || product.weightUnit,
        
        // Dimensions
        itemHeight: externalData?.dimensions?.height || product.itemHeight,
        itemLength: externalData?.dimensions?.length || product.itemLength,
        itemWidth: externalData?.dimensions?.width || product.itemWidth,
        
        // Material & Construction
        material: externalData?.material || product.material,
        
        // Category-Specific Fields
        // Clothing & Fashion
        ageGroup: externalData?.ageGroup || product.ageGroup,
        
        // Collectibles & Entertainment
        theme: externalData?.theme || product.theme,
        character: externalData?.character || product.character,
        exclusivity: externalData?.exclusivity || product.exclusivity,
        funkoPop: externalData?.funkoPop ?? product.funkoPop,
        series: externalData?.series || product.series,
        
        // General Attributes
        features: aiContent.keyFeatures?.join(', ') || externalData?.features || product.features,
        releaseDate: externalData?.releaseDate || product.releaseDate,
        category: externalData?.category || product.category,
        
        // Additional attributes from external data
        ...(externalData?.additionalAttributes || {})
      }

      // Step 5: Apply market research pricing if available and requested
      let pricingUpdates = {}
      if (includePricing && marketResearch?.insights?.suggestedPrice) {
        const suggestedPrice = marketResearch.insights.suggestedPrice
        console.log(`💰 Applying suggested price: $${suggestedPrice}`)
        pricingUpdates = {
          lowestRecordedPrice: suggestedPrice,
          // Update price range based on market research
          highestRecordedPrice: marketResearch.insights.priceRange?.max || suggestedPrice * 1.2
        }
      }

      // Step 6: Update product with comprehensive enhancement data
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          // Core fields
          title: enhancedContent.title || product.title,
          description: enhancedContent.description || product.description,
          brand: enhancedContent.brand,
          model: enhancedContent.model,
          mpn: enhancedContent.mpn,
          sku: enhancedContent.sku,
          
          // Physical attributes
          color: enhancedContent.color,
          size: enhancedContent.size,
          weight: enhancedContent.weight,
          weightUnit: enhancedContent.weightUnit,
          
          // Dimensions
          itemHeight: enhancedContent.itemHeight,
          itemLength: enhancedContent.itemLength,
          itemWidth: enhancedContent.itemWidth,
          
          // Materials and construction
          material: enhancedContent.material,
          
          // Category-specific fields
          ageGroup: enhancedContent.ageGroup,
          theme: enhancedContent.theme,
          character: enhancedContent.character,
          exclusivity: enhancedContent.exclusivity,
          funkoPop: enhancedContent.funkoPop,
          series: enhancedContent.series,
          
          // General attributes
          features: enhancedContent.features,
          releaseDate: enhancedContent.releaseDate,
          category: enhancedContent.category,
          
          // Pricing from market research
          ...pricingUpdates,
          
          // Enhancement tracking
          enhancementStatus: 'enhanced',
          lastEnhanced: new Date(),
          updatedAt: new Date()
        }
      })


      // Step 6.5: If product has no images, trigger image fetch
      let newImages: any[] = []
      let imageStats = { added: 0, skipped: 0, errors: 0 }
      const productImages = await prisma.productImage.findMany({ where: { productId } })
      if (!productImages || productImages.length === 0) {
        // Call the image fetch API internally
        try {
          const fetchRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3074'}/api/vision/fetch-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId,
              upc: product.upc,
              productTitle: product.title
            })
          })
          if (fetchRes.ok) {
            const fetchResult = await fetchRes.json()
            newImages = fetchResult.images || []
            imageStats = {
              added: fetchResult.imagesAdded || 0,
              skipped: 0,
              errors: 0
            }
          } else {
            console.error('Failed to fetch images during AI enhancement:', await fetchRes.text())
          }
        } catch (err) {
          console.error('Error calling fetch-images API during AI enhancement:', err)
        }
      }

      // Step 7: Save comprehensive AI content to database
      await prisma.aIContent.upsert({
        where: { productId },
        create: {
          productId,
          seoTitle: aiContent.seoTitle,
          seoDescription: aiContent.shortDescription,
          productDescription: aiContent.productDescription,
          bulletPoints: JSON.stringify(aiContent.keyFeatures || []),
          tags: JSON.stringify(aiContent.tags || []),
          category: enhancedContent.category || 'General',
          specifications: JSON.stringify(aiContent.itemSpecifics || {}),
          marketingCopy: `eBay Title: ${aiContent.ebayTitle}\n\nUnique Selling Points:\n${(aiContent.uniqueSellingPoints || []).join('\n')}`,
          ebayTitle: aiContent.ebayTitle,
          shortDescription: aiContent.shortDescription,
          uniqueSellingPoints: JSON.stringify(aiContent.uniqueSellingPoints || []),
          keyFeatures: JSON.stringify(aiContent.keyFeatures || []),
          specificationsArray: JSON.stringify(aiContent.specifications || []),
          itemSpecifics: JSON.stringify(aiContent.itemSpecifics || {}),
          additionalAttributes: JSON.stringify(aiContent.additionalAttributes || {}),
          status: 'completed',
          aiModel: geminiService.getModelInfo().configured ? geminiService.getModelInfo().primary : 'mock',
          generatedAt: new Date(),
          processingTime
        },
        update: {
          seoTitle: aiContent.seoTitle,
          seoDescription: aiContent.shortDescription,
          productDescription: aiContent.productDescription,
          bulletPoints: JSON.stringify(aiContent.keyFeatures || []),
          tags: JSON.stringify(aiContent.tags || []),
          category: enhancedContent.category || 'General',
          specifications: JSON.stringify(aiContent.itemSpecifics || {}),
          marketingCopy: `eBay Title: ${aiContent.ebayTitle}\n\nUnique Selling Points:\n${(aiContent.uniqueSellingPoints || []).join('\n')}`,
          ebayTitle: aiContent.ebayTitle,
          shortDescription: aiContent.shortDescription,
          uniqueSellingPoints: JSON.stringify(aiContent.uniqueSellingPoints || []),
          keyFeatures: JSON.stringify(aiContent.keyFeatures || []),
          specificationsArray: JSON.stringify(aiContent.specifications || []),
          itemSpecifics: JSON.stringify(aiContent.itemSpecifics || {}),
          additionalAttributes: JSON.stringify(aiContent.additionalAttributes || {}),
          status: 'completed',
          aiModel: geminiService.getModelInfo().configured ? geminiService.getModelInfo().primary : 'mock',
          generatedAt: new Date(),
          processingTime,
          updatedAt: new Date()
        }
      })

      console.log(`✅ Comprehensively enhanced product: ${updatedProduct.title}`)

      return NextResponse.json({
        success: true,
        message: 'Product comprehensively enhanced successfully',
        product: {
          id: updatedProduct.id,
          title: updatedProduct.title,
          description: updatedProduct.description,
          brand: updatedProduct.brand,
          enhancementStatus: updatedProduct.enhancementStatus,
          lastEnhanced: updatedProduct.lastEnhanced,
          lowestRecordedPrice: updatedProduct.lowestRecordedPrice,
          highestRecordedPrice: updatedProduct.highestRecordedPrice
        },
        enhancements: enhancedContent,
        externalData: externalData ? Object.keys(externalData) : null,
        marketResearch: marketResearch ? {
          suggestedPrice: marketResearch.insights?.suggestedPrice,
          priceRange: marketResearch.insights?.priceRange,
          confidence: marketResearch.insights?.marketConfidence
        } : null,
        aiContent: {
          ebayTitle: aiContent.ebayTitle,
          keyFeatures: aiContent.keyFeatures,
          uniqueSellingPoints: aiContent.uniqueSellingPoints,
          tags: aiContent.tags
        },
        images: imageStats,
        processingTime
      })

    } catch (aiError) {
      console.error('AI enhancement error:', aiError)
      
      // Fallback enhancement with external data if available
      const fallbackTitle = (externalData?.brand || product.brand) 
        ? `${externalData?.brand || product.brand} ${product.title}` 
        : product.title
      const fallbackDescription = `${product.title} in ${product.condition} condition. ${product.description || 'High-quality product ready for immediate use.'}`

      // Still apply external data and pricing if available
      let pricingUpdates = {}
      if (includePricing && marketResearch?.insights?.suggestedPrice) {
        pricingUpdates = {
          lowestRecordedPrice: marketResearch.insights.suggestedPrice,
          highestRecordedPrice: marketResearch.insights.priceRange?.max || marketResearch.insights.suggestedPrice * 1.2
        }
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          title: fallbackTitle,
          description: fallbackDescription,
          brand: externalData?.brand || product.brand,
          model: externalData?.model || product.model,
          color: externalData?.color || product.color,
          size: externalData?.size || product.size,
          weight: externalData?.weight || product.weight,
          weightUnit: externalData?.weightUnit || product.weightUnit,
          material: externalData?.material || product.material,
          ageGroup: externalData?.ageGroup || product.ageGroup,
          theme: externalData?.theme || product.theme,
          character: externalData?.character || product.character,
          exclusivity: externalData?.exclusivity || product.exclusivity,
          features: externalData?.features || product.features,
          funkoPop: externalData?.funkoPop ?? product.funkoPop,
          itemHeight: externalData?.dimensions?.height || product.itemHeight,
          itemLength: externalData?.dimensions?.length || product.itemLength,
          itemWidth: externalData?.dimensions?.width || product.itemWidth,
          series: externalData?.series || product.series,
          category: externalData?.category || product.category,
          ...pricingUpdates,
          enhancementStatus: 'enhanced',
          lastEnhanced: new Date(),
          updatedAt: new Date()
        }
      })

      // Process images in fallback too
      const imageStats = { added: 0, skipped: 0, errors: 0 }
      if (externalData?.images && externalData.images.length > 0) {
        console.log(`📸 Processing ${externalData.images.length} external images (fallback)...`)
        
        const existingImages = await prisma.productImage.findMany({
          where: { productId },
          select: { originalUrl: true, imageNumber: true }
        })
        
        const existingUrls = new Set(existingImages.map(img => img.originalUrl))
        let nextImageNumber = existingImages.length > 0 
          ? Math.max(...existingImages.map(img => img.imageNumber)) + 1 
          : 1
        
        for (const imageUrl of externalData.images.slice(0, 10)) {
          try {
            if (existingUrls.has(imageUrl) || !imageUrl?.startsWith('http')) {
              imageStats.skipped++
              continue
            }
            
            await prisma.productImage.create({
              data: {
                productId,
                imageNumber: nextImageNumber,
                originalUrl: imageUrl,
                uploadStatus: 'pending'
              }
            })
            
            nextImageNumber++
            imageStats.added++
            
          } catch (error) {
            imageStats.errors++
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Product enhanced with fallback content (AI unavailable) + external data',
        product: {
          id: updatedProduct.id,
          title: updatedProduct.title,
          description: updatedProduct.description,
          brand: updatedProduct.brand,
          enhancementStatus: updatedProduct.enhancementStatus,
          lastEnhanced: updatedProduct.lastEnhanced,
          lowestRecordedPrice: updatedProduct.lowestRecordedPrice,
          highestRecordedPrice: updatedProduct.highestRecordedPrice
        },
        enhancements: {
          title: fallbackTitle,
          description: fallbackDescription
        },
        externalData: externalData ? Object.keys(externalData) : null,
        marketResearch: marketResearch ? {
          suggestedPrice: marketResearch.insights?.suggestedPrice,
          priceRange: marketResearch.insights?.priceRange
        } : null,
        images: imageStats
      })
    }

  } catch (error) {
    console.error('Error enhancing product:', error)
    return NextResponse.json(
      { error: 'Failed to enhance product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}