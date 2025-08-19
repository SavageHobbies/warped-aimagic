import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const UPCITEMDB_API_URL = 'https://api.upcitemdb.com/prod/trial'

export async function POST(request: NextRequest) {
  try {
    const { query, category } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // First, check if we have matching products in our database
    const existingProducts = await prisma.product.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        images: true,
        aiContent: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (existingProducts.length > 0) {
      // Return the first matching product from our database
      const product = existingProducts[0]
      const primaryCategory = product.categories.find(c => c.isPrimary)?.category
      
      return NextResponse.json({
        id: product.id,
        upc: product.upc,
        title: product.title,
        brand: product.brand,
        description: product.description || product.aiContent?.shortDescription,
        category: primaryCategory?.fullPath || category || 'General',
        images: product.images.map(img => img.originalUrl).filter(Boolean),
        model: product.model,
        color: product.color,
        size: product.size,
        weight: product.weight ? `${product.weight}${product.weightUnit || 'g'}` : '',
        source: 'database'
      })
    }

    // If not in database, search UPCItemDB by name
    try {
      const searchParams = new URLSearchParams({
        s: query, // Search query
        match_mode: '0', // Best match
        type: 'product'
      })

      const response = await fetch(`${UPCITEMDB_API_URL}/search?${searchParams}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip,deflate',
        }
      })

      if (!response.ok) {
        console.error('UPCItemDB search failed:', response.status)
        throw new Error('External search failed')
      }

      const data = await response.json()

      if (data.items && data.items.length > 0) {
        const item = data.items[0] // Take the best match

        // Transform UPCItemDB response to our format
        const productData = {
          upc: item.upc || item.ean || '',
          ean: item.ean || '',
          title: item.title || item.name || 'Unknown Product',
          description: item.description || '',
          brand: item.brand || '',
          model: item.model || '',
          color: item.color || '',
          size: item.size || '',
          weight: parseFloat(item.weight) || null,
          images: item.images ? item.images.map((url) => ({ originalUrl: url })) : [],
          offers: item.offers ? item.offers.map((offer) => ({
            merchant: offer.merchant,
            domain: offer.domain,
            title: offer.title,
            currency: offer.currency,
            listPrice: parseFloat(offer.list_price) || null,
            price: parseFloat(offer.price) || null,
            shipping: offer.shipping,
            condition: offer.condition,
            availability: offer.availability,
            link: offer.link,
          })) : [],
          categories: item.category ? [{ name: item.category, type: 'general', fullPath: item.category }] : [],
          lowestRecordedPrice: item.lowest_recorded_price || item.lowestPrice || null,
          highestRecordedPrice: item.highest_recorded_price || item.highestPrice || null,
          source: 'upcitemdb'
        }

        return NextResponse.json(productData)
      }
    } catch (apiError) {
      console.error('UPCItemDB API error:', apiError)
    }

    // If all else fails, return a basic product structure
    return NextResponse.json({
      upc: '',
      title: query,
      brand: '',
      description: `Product matching: ${query}`,
      category: category || 'General',
      images: [],
      source: 'manual',
      needsManualEntry: true
    })

  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search for product' },
      { status: 500 }
    )
  }
}
