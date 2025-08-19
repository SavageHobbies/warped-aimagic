import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/listings/drafts - List all drafts with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const marketplace = searchParams.get('marketplace')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Prisma.ListingDraftWhereInput = {}
    if (status) where.status = status
    if (marketplace) where.marketplace = marketplace

    const [drafts, total] = await Promise.all([
      prisma.listingDraft.findMany({
        where,
        include: {
          product: {
            include: {
              images: {
                orderBy: { imageNumber: 'asc' },
                take: 1
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.listingDraft.count({ where })
    ])

    return NextResponse.json({
      drafts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching listing drafts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing drafts' },
      { status: 500 }
    )
  }
}

// POST /api/listings/drafts - Create a new draft from a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, marketplace = 'EBAY', price, quantity = 1, ...otherFields } = body

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Generate SKU if not present
    if (!product.sku) {
      await prisma.product.update({
        where: { id: productId },
        data: { sku: `SKU-${product.upc}` }
      })
    }

    // Create the draft
    const draft = await prisma.listingDraft.create({
      data: {
        productId,
        marketplace,
        price: new Prisma.Decimal(price || product.lowestRecordedPrice || 0),
        quantity: quantity || product.quantity || 1,
        conditionId: product.condition === 'New' ? 1000 : 3000, // eBay condition IDs
        ...otherFields
      },
      include: {
        product: true
      }
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    console.error('Error creating listing draft:', error)
    return NextResponse.json(
      { error: 'Failed to create listing draft' },
      { status: 500 }
    )
  }
}

// PATCH /api/listings/drafts - Bulk update drafts
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, updates } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid draft IDs' },
        { status: 400 }
      )
    }

    // Handle price update if present
    if (updates.price !== undefined) {
      updates.price = new Prisma.Decimal(updates.price)
    }

    const result = await prisma.listingDraft.updateMany({
      where: { id: { in: ids } },
      data: updates
    })

    return NextResponse.json({
      updated: result.count,
      message: `Updated ${result.count} draft(s)`
    })
  } catch (error) {
    console.error('Error updating listing drafts:', error)
    return NextResponse.json(
      { error: 'Failed to update listing drafts' },
      { status: 500 }
    )
  }
}
