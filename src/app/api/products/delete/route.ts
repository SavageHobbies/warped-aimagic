import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for delete request
const DeleteRequestSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product ID is required'),
  force: z.boolean().optional().default(false) // Force delete even if referenced
})

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, force } = DeleteRequestSchema.parse(body)
    
    console.log(`Attempting to delete ${productIds.length} products`, { productIds, force })
    
    // Check if products exist
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        images: true,
        listings: true,
        drafts: true,
        categories: true
      }
    })
    
    if (existingProducts.length === 0) {
      return NextResponse.json(
        { error: 'No products found with the provided IDs' },
        { status: 404 }
      )
    }
    
    // Check for references if not forced
    const productsWithReferences = []
    for (const product of existingProducts) {
      const hasReferences = (
        product.listings.length > 0 || 
        product.drafts.length > 0
      )
      
      if (hasReferences) {
        productsWithReferences.push({
          id: product.id,
          title: product.title,
          references: {
            listings: product.listings.length,
            drafts: product.drafts.length
          }
        })
      }
    }
    
    if (productsWithReferences.length > 0 && !force) {
      return NextResponse.json({
        error: 'Some products have existing references',
        details: 'Products cannot be deleted because they have existing listings or drafts',
        productsWithReferences,
        suggestion: 'Set force=true to delete anyway or remove references first'
      }, { status: 409 })
    }
    
    // Perform deletion in transaction
    const deletionResult = await prisma.$transaction(async (tx) => {
      const results = {
        deleted: [] as string[],
        errors: [] as Array<{ id: string, error: string }>
      }
      
      for (const productId of productIds) {
        try {
          // Delete related data first
          await tx.productImage.deleteMany({
            where: { productId }
          })
          
          await tx.productCategory.deleteMany({
            where: { productId }
          })
          
          await tx.offer.deleteMany({
            where: { productId }
          })
          
          // If force delete, remove listings and drafts
          if (force) {
            await tx.listing.deleteMany({
              where: { productId }
            })
            
            await tx.draft.deleteMany({
              where: { productId }
            })
          }
          
          // Delete the product
          await tx.product.delete({
            where: { id: productId }
          })
          
          results.deleted.push(productId)
          console.log(`Successfully deleted product: ${productId}`)
          
        } catch (error) {
          console.error(`Failed to delete product ${productId}:`, error)
          results.errors.push({
            id: productId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      return results
    })
    
    // Return results
    const success = deletionResult.deleted.length > 0
    const message = `Deletion completed: ${deletionResult.deleted.length} deleted, ${deletionResult.errors.length} errors`
    
    return NextResponse.json({
      success,
      message,
      deleted: deletionResult.deleted,
      errors: deletionResult.errors,
      summary: {
        requested: productIds.length,
        deleted: deletionResult.deleted.length,
        failed: deletionResult.errors.length
      }
    })
    
  } catch (error) {
    console.error('Product deletion error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.issues 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}