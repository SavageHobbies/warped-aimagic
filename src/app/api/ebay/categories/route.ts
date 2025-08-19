import { NextRequest, NextResponse } from 'next/server'
import { ebayService } from '@/lib/ebay'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
  }

  if (!ebayService.isConfigured()) {
    return NextResponse.json(
      { error: 'eBay service is not configured. Please check API credentials.' },
      { status: 503 } // Service Unavailable
    )
  }

  try {
    const searchResults = await ebayService.searchByKeywords(query, undefined, 50)

    if (!searchResults?.itemSummaries?.length) {
      return NextResponse.json([])
    }

    // Use a Map to store unique categories and their counts
    const categoryMap = new Map<string, { name: string; count: number; fullPath?: string }>()

    searchResults.itemSummaries.forEach(item => {
      if (item.categories) {
        // Typically, the first category is the most specific one
        const primaryCategory = item.categories[0]
        if (primaryCategory) {
          const { categoryId, categoryName } = primaryCategory
          if (categoryMap.has(categoryId)) {
            categoryMap.get(categoryId)!.count++
          } else {
            categoryMap.set(categoryId, {
              name: categoryName,
              count: 1,
              // We don't have the full path here, but the name is usually sufficient for selection
            })
          }
        }
      }
    })

    // Convert map to array and sort by count (most frequent first)
    const uniqueCategories = Array.from(categoryMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Return top 10 suggestions

    return NextResponse.json(uniqueCategories)
  } catch (error) {
    console.error('Error searching eBay categories:', error)
    return NextResponse.json(
      { error: 'Failed to search eBay categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
