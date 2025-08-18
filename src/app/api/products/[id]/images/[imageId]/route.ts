import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id: productId, imageId } = await params

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: 'Product ID and Image ID are required' },
        { status: 400 }
      )
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if image exists and belongs to this product
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: productId
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found or does not belong to this product' },
        { status: 404 }
      )
    }

    // Delete the image from database
    await prisma.productImage.delete({
      where: {
        id: imageId
      }
    })

    // Log the deletion
    await prisma.apiLog.create({
      data: {
        service: 'inventory-scanner',
        endpoint: `/api/products/${productId}/images/${imageId}`,
        method: 'DELETE',
        statusCode: 200,
        requestData: JSON.stringify({ productId, imageId }),
        responseData: JSON.stringify({ message: 'Image deleted successfully' })
      }
    })

    return NextResponse.json(
      { message: 'Image deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting image:', error)
    
    // Log the error
    try {
      const resolvedParams = await params
      await prisma.apiLog.create({
        data: {
          service: 'inventory-scanner',
          endpoint: `/api/products/${resolvedParams.id}/images/${resolvedParams.imageId}`,
          method: 'DELETE',
          statusCode: 500,
          requestData: JSON.stringify({ productId: resolvedParams.id, imageId: resolvedParams.imageId }),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          responseData: JSON.stringify({ error: 'Failed to delete image' })
        }
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
