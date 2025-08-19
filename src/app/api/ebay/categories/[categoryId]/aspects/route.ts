import { NextRequest, NextResponse } from 'next/server'
import { ebayService } from '@/lib/ebay'

export async function GET(request: NextRequest, { params }: { params: { categoryId: string } }) {
  const { categoryId } = params

  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
  }

  if (!ebayService.isConfigured()) {
    return NextResponse.json(
      { error: 'eBay service is not configured. Please check API credentials.' },
      { status: 503 } // Service Unavailable
    )
  }

  try {
    const aspects = await ebayService.getCategoryAspects(categoryId)

    if (!aspects) {
      return NextResponse.json({ error: `No aspects found for category ${categoryId}` }, { status: 404 })
    }

    return NextResponse.json(aspects)
  } catch (error) {
    console.error(`Error fetching aspects for category ${categoryId}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch eBay category aspects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
