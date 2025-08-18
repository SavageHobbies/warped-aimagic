import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upcItemDB } from '@/lib/upcitemdb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { upc, addToInventory = false, quantity = 0 } = body

    if (!upc) {
      return NextResponse.json({ error: 'UPC is required' }, { status: 400 })
    }

    // First, check if product already exists in database
    const existingProduct = await prisma.product.findUnique({
      where: { upc },
      include: {
        images: true,
        offers: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (existingProduct) {
      console.log(`Product found in database for UPC: ${upc}`)
      
      // Update lastScanned timestamp and add to inventory if requested
      const updateData: { lastScanned: Date; quantity?: number } = { lastScanned: new Date() }
      if (addToInventory && quantity > 0) {
        updateData.quantity = existingProduct.quantity + quantity
      }
      
      const updatedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: updateData,
        include: {
          images: true,
          offers: true,
          categories: {
            include: {
              category: true
            }
          }
        }
      })

      return NextResponse.json({
        source: 'database',
        ...updatedProduct
      })
    }

    // Product not in database, lookup from API
    console.log(`Looking up product from API for UPC: ${upc}`)
    
    // ALWAYS use real API - no mock data
    console.log(`CALLING REAL UPCItemDB API for UPC: ${upc}`)
    const apiResponse = await upcItemDB.lookupProduct(upc)
    console.log(`Real API Response:`, apiResponse)

    if (apiResponse.code !== 'OK' || !apiResponse.items || apiResponse.items.length === 0) {
      return NextResponse.json({ 
        error: 'Product not found',
        rateLimitInfo: upcItemDB.getRateLimitInfo()
      }, { status: 404 })
    }

    const item = apiResponse.items[0]

    // Create product in database
    const product = await prisma.product.create({
      data: {
        upc: item.upc,
        ean: item.ean,
        gtin: item.gtin,
        title: item.title,
        description: item.description,
        brand: item.brand,
        model: item.model,
        color: item.color,
        size: item.size,
        dimensions: item.dimension,
        weight: item.weight,
        quantity: addToInventory && quantity > 0 ? quantity : 1, // Default to 1 when scanned
        currency: item.currency || 'USD',
        lowestRecordedPrice: item.lowest_recorded_price ? parseFloat(item.lowest_recorded_price) : null,
        highestRecordedPrice: item.highest_recorded_price ? parseFloat(item.highest_recorded_price) : null,
        lastScanned: new Date(),
      }
    })

    // Create product images
    if (item.images) {
      const imagePromises = item.images.map((imageUrl, index) =>
        prisma.productImage.create({
          data: {
            productId: product.id,
            imageNumber: index + 1,
            originalUrl: imageUrl,
            uploadStatus: 'pending'
          }
        })
      )
      await Promise.all(imagePromises)
    }

    // Create offers
    if (item.offers) {
      const offerPromises = item.offers.map(offer =>
        prisma.offer.create({
          data: {
            productId: product.id,
            merchant: offer.merchant,
            domain: offer.domain,
            title: offer.title,
            price: offer.price ? parseFloat(offer.price) : null,
            listPrice: offer.list_price ? parseFloat(offer.list_price) : null,
            currency: offer.currency || 'USD',
            shipping: offer.shipping,
            condition: offer.condition,
            availability: offer.availability,
            link: offer.link
          }
        })
      )
      await Promise.all(offerPromises)
    }

    // Handle category
    if (item.category) {
      const category = await prisma.category.upsert({
        where: {
          type_categoryId: {
            type: 'google',
            categoryId: item.category
          }
        },
        update: {},
        create: {
          type: 'google',
          categoryId: item.category,
          name: item.category.split(' > ').pop() || item.category,
          fullPath: item.category
        }
      })

      await prisma.productCategory.create({
        data: {
          productId: product.id,
          categoryId: category.id,
          isPrimary: true
        }
      })
    }

    // Log API call
    await prisma.apiLog.create({
      data: {
        service: 'upcitemdb',
        endpoint: '/prod/trial/lookup',
        method: 'GET',
        statusCode: 200,
        requestData: JSON.stringify({ upc }),
        responseData: JSON.stringify(apiResponse)
      }
    })

    // Fetch complete product with relations
    const completeProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        offers: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json({
      source: 'api',
      rateLimitInfo: upcItemDB.getRateLimitInfo(),
      ...completeProduct
    })

  } catch (error) {
    console.error('Error in product lookup:', error)
    
    // Log error to database
    try {
      await prisma.apiLog.create({
        data: {
          service: 'upcitemdb',
          endpoint: '/prod/trial/lookup',
          method: 'GET',
          statusCode: 500,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    } catch (logError) {
      console.error('Error logging API error:', logError)
    }

    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        { 
          error: error.message,
          rateLimitInfo: upcItemDB.getRateLimitInfo()
        }, 
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
