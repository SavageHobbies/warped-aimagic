import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
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
        },
        listings: true,
        drafts: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
