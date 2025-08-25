import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/listings/drafts - List all drafts with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Prisma.DraftWhereInput = {}
    if (platform) where.platform = platform

    const [drafts, total] = await Promise.all([
      prisma.draft.findMany({
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
      prisma.draft.count({ where })
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
    const { productId, marketplace = 'EBAY', price, quantity = 1, title, description, notes } = body

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

    // Create the draft using our actual Draft model
    const draft = await prisma.draft.create({
      data: {
        productId,
        title: title || product.title,
        description: description || product.description,
        price: price || product.lowestRecordedPrice || 0,
        platform: marketplace,
        notes: notes || null
      },
      include: {
        product: true
      }
    })

    return NextResponse.json(draft, { status: 201 })
  } catch (error) {
    console.error('Error creating listing draft:', error)
    return NextResponse.json(
      { error: 'Failed to create listing draft', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const result = await prisma.draft.updateMany({
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
