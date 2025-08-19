import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/listings/drafts/[id] - Get a single draft
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const draft = await prisma.listingDraft.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            images: {
              orderBy: { imageNumber: 'asc' }
            },
            aiContent: true,
            categories: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(draft)
  } catch (error) {
    console.error('Error fetching draft:', error)
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    )
  }
}

// PUT /api/listings/drafts/[id] - Update a single draft
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Handle price update if present
    if (body.price !== undefined) {
      body.price = new Prisma.Decimal(body.price)
    }

    const draft = await prisma.listingDraft.update({
      where: { id },
      data: body,
      include: {
        product: true
      }
    })

    return NextResponse.json(draft)
  } catch (error) {
    console.error('Error updating draft:', error)
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/drafts/[id] - Delete a draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.listingDraft.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Draft deleted successfully' })
  } catch (error) {
    console.error('Error deleting draft:', error)
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    )
  }
}
