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

    // ALWAYS check database first to avoid unnecessary API calls
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
      console.log(`✅ Product FOUND in database for UPC: ${upc}`)
      console.log(`   Current quantity: ${existingProduct.quantity}`)
      
      // Always increment quantity when scanning existing products
      const incrementAmount = quantity > 0 ? quantity : 1  // Default to 1 if not specified
      const newQuantity = existingProduct.quantity + incrementAmount
      
      console.log(`   Adding ${incrementAmount} unit(s), new quantity will be: ${newQuantity}`)
      
      const updatedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          lastScanned: new Date(),
          quantity: newQuantity
        },
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

      console.log(`   ✅ Updated quantity to: ${updatedProduct.quantity}`)

      return NextResponse.json({
        source: 'database',
        message: `Product already exists. Added ${incrementAmount} unit(s). Total quantity: ${updatedProduct.quantity}`,
        previousQuantity: existingProduct.quantity,
        quantityAdded: incrementAmount,
        ...updatedProduct
      })
    }

    // Product NOT in database, need to lookup from API
    console.log(`❌ Product NOT found in database for UPC: ${upc}`)
    console.log(`📡 Making API call to UPCItemDB for product details...`)
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
    console.log(`🏭 Creating new product from UPC database:`, {
      upc: item.upc,
      title: item.title,
      brand: item.brand,
      description: item.description?.substring(0, 100) + '...'
    })
    
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
        dimensions: item.dimension && typeof item.dimension === 'object' 
          ? { length: 0, width: 0, height: 0, ...(item.dimension as Record<string, any>) } 
          : undefined,
        weight: item.weight ? parseFloat(item.weight) : null,
        quantity: quantity > 0 ? quantity : 1, // Default to 1 when first scanned
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
