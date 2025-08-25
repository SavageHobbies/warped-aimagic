import { NextRequest, NextResponse } from 'next/server'
import { upcItemDB } from '@/lib/upcitemdb'
import { upcDatabase } from '@/lib/upcdatabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, brand } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Searching for UPC by product name: "${productName}"${brand ? ` (Brand: ${brand})` : ''}`)

    // Get usage info from both services
    const upcItemDBInfo = upcItemDB.getSearchCount()
    const upcDatabaseInfo = upcDatabase.getUsageInfo()
    
    console.log(`📊 Search capacity:`)  
    console.log(`   - UPCItemDB: ${upcItemDBInfo.remaining}/${upcItemDBInfo.limit} searches remaining`)
    console.log(`   - UPCDatabase.org: ${upcDatabaseInfo.searches.remaining}/${upcDatabaseInfo.searches.limit} searches remaining`)

    let searchResult = null
    let searchSource = ''
    let updatedUsage = null

    // Strategy 1: Try UPCDatabase.org first (25 searches/day)
    if (upcDatabase.isConfigured() && upcDatabaseInfo.searches.remaining > 0) {
      try {
        console.log(`🎯 Trying UPCDatabase.org first...`)
        const dbResult = await upcDatabase.searchByName(productName, brand)
        
        if (dbResult.success && dbResult.products && dbResult.products.length > 0) {
          searchResult = {
            upc: dbResult.products[0].upc,
            productDetails: {
              title: dbResult.products[0].title,
              brand: dbResult.products[0].brand,
              description: dbResult.products[0].description,
              category: dbResult.products[0].category
            },
            totalResults: dbResult.products.length
          }
          searchSource = 'UPCDatabase.org'
          updatedUsage = upcDatabase.getUsageInfo()
          
          console.log(`✅ Found UPC via UPCDatabase.org: ${searchResult.upc}`)
        } else {
          console.log(`❌ No results from UPCDatabase.org`)
        }
      } catch (error) {
        console.error('UPCDatabase.org search failed:', error)
      }
    }

    // Strategy 2: Fallback to UPCItemDB if no results or UPCDatabase.org unavailable
    if (!searchResult && upcItemDBInfo.remaining > 0) {
      try {
        console.log(`🎯 Trying UPCItemDB as fallback...`)
        const itemDBResult = await upcItemDB.searchProductByName(productName, brand)
        
        if (itemDBResult.code === 'OK' && itemDBResult.items && itemDBResult.items.length > 0) {
          const bestMatch = itemDBResult.items[0]
          searchResult = {
            upc: bestMatch.upc,
            productDetails: {
              title: bestMatch.title,
              brand: bestMatch.brand,
              description: bestMatch.description,
              category: bestMatch.category
            },
            totalResults: itemDBResult.total
          }
          searchSource = 'UPCItemDB'
          updatedUsage = {
            upcitemdb: upcItemDB.getSearchCount(),
            upcdatabase: upcDatabase.getUsageInfo()
          }
          
          console.log(`✅ Found UPC via UPCItemDB: ${searchResult.upc}`)
        } else {
          console.log(`❌ No results from UPCItemDB`)
        }
      } catch (error) {
        console.error('UPCItemDB search failed:', error)
      }
    }

    // Return results
    if (searchResult) {
      const finalUsage = updatedUsage || {
        upcitemdb: upcItemDB.getSearchCount(),
        upcdatabase: upcDatabase.getUsageInfo()
      }
      
      return NextResponse.json({
        success: true,
        upc: searchResult.upc,
        productDetails: searchResult.productDetails,
        searchQuery: brand ? `${brand} ${productName}` : productName,
        totalResults: searchResult.totalResults,
        searchSource: searchSource,
        usage: {
          upcItemDB: {
            used: ('upcitemdb' in finalUsage && finalUsage.upcitemdb) ? finalUsage.upcitemdb.used : upcItemDBInfo.used,
            remaining: ('upcitemdb' in finalUsage && finalUsage.upcitemdb) ? finalUsage.upcitemdb.remaining : upcItemDBInfo.remaining,
            limit: ('upcitemdb' in finalUsage && finalUsage.upcitemdb) ? finalUsage.upcitemdb.limit : upcItemDBInfo.limit
          },
          upcDatabase: {
            searches: ('upcdatabase' in finalUsage && finalUsage.upcdatabase) ? finalUsage.upcdatabase.searches : upcDatabaseInfo.searches,
            lookups: ('upcdatabase' in finalUsage && finalUsage.upcdatabase) ? finalUsage.upcdatabase.lookups : upcDatabaseInfo.lookups
          }
        }
      })
    } else {
      // No results from either service
      return NextResponse.json({
        success: false,
        upc: null,
        message: 'No products found matching the search criteria in either database',
        searchQuery: brand ? `${brand} ${productName}` : productName,
        totalResults: 0,
        searchSource: 'none',
        usage: {
          upcItemDB: {
            used: upcItemDBInfo.used,
            remaining: upcItemDBInfo.remaining,
            limit: upcItemDBInfo.limit
          },
          upcDatabase: {
            searches: upcDatabaseInfo.searches,
            lookups: upcDatabaseInfo.lookups
          }
        }
      })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { 
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}