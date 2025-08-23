import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateProduct(request, params)
}

// Alias for PATCH to support PUT requests
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateProduct(request, params)
}

async function updateProduct(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    const {
      title,
      description,
      brand,
      model,
      color,
      size,
      weight,
      dimensions,
      condition,
      material,
      mpn,
      ageGroup,
      theme,
      character,
      series,
      exclusivity,
      releaseDate,
      features,
      funkoPop,
      isbn,
      quantity,
      aiContent
    } = body

    // Update product and AI content if provided
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update the main product
      const product = await tx.product.update({
        where: { id },
        data: {
          title,
          description,
          brand,
          model,
          color,
          size,
          weight,
          dimensions,
          condition,
          material,
          mpn,
          ageGroup,
          theme,
          character,
          series,
          exclusivity,
          releaseDate,
          features,
          funkoPop: typeof funkoPop === 'boolean' ? funkoPop : undefined,
          isbn,
          quantity: typeof quantity === 'number' ? quantity : undefined,
          updatedAt: new Date()
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

      // Update AI content if provided
      if (aiContent && typeof aiContent === 'object') {
        // Store AI content in the aiGeneratedContent JSON field for now
        await tx.product.update({
          where: { id },
          data: {
            aiGeneratedContent: aiContent
          }
        })
      }

      return product
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            imageNumber: 'asc'
          }
        },
        offers: {
          orderBy: {
            price: 'asc'
          }
        },
        categories: {
          include: {
            category: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true, title: true, upc: true }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete the product (Prisma will handle cascading deletes for related data)
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ 
      message: 'Product deleted successfully',
      deletedProduct: existingProduct
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
