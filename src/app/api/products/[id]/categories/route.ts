import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const productId = params.id

  try {
    const body = await request.json()
    const { categoryId, name, fullPath } = body

    if (!categoryId || !name) {
      return NextResponse.json({ error: 'categoryId and name are required' }, { status: 400 })
    }

    const newProductCategory = await prisma.$transaction(async (tx) => {
      // 1. Upsert the category itself to ensure it exists in our DB
      const category = await tx.category.upsert({
        where: {
          type_categoryId: {
            type: 'EBAY',
            categoryId: categoryId,
          }
        },
        update: { name, fullPath },
        create: {
          type: 'EBAY',
          categoryId: categoryId,
          name: name,
          fullPath: fullPath || name,
        },
      })

      // 2. Unset any other primary category for this product
      await tx.productCategory.updateMany({
        where: {
          productId: productId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })

      // 3. Create the link between the product and the category
      const productCategory = await tx.productCategory.create({
        data: {
          productId: productId,
          categoryId: category.id,
          isPrimary: true, // The newly added category is now the primary one
        },
        include: {
          category: true, // Include the category data in the response
        },
      })

      return productCategory
    })

    return NextResponse.json(newProductCategory)
  } catch (error) {
    console.error(`Failed to add category to product ${productId}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to add category', details: errorMessage },
      { status: 500 }
    )
  }
}
