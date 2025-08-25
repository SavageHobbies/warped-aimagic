import { NextRequest, NextResponse } from 'next/server'
import { upcItemDB } from '@/lib/upcitemdb'
import { upcDatabase } from '@/lib/upcdatabase'

export async function GET(request: NextRequest) {
  try {
    const upcItemDBUsage = upcItemDB.getSearchCount()
    const upcDatabaseUsage = upcDatabase.getUsageInfo()
    
    return NextResponse.json({
      services: {
        upcItemDB: {
          name: 'UPCItemDB',
          configured: true,
          searches: {
            used: upcItemDBUsage.used,
            remaining: upcItemDBUsage.remaining,
            limit: upcItemDBUsage.limit,
            percentage: Math.round((upcItemDBUsage.used / upcItemDBUsage.limit) * 100)
          }
        },
        upcDatabase: {
          name: 'UPCDatabase.org',
          configured: upcDatabase.isConfigured(),
          searches: {
            used: upcDatabaseUsage.searches.used,
            remaining: upcDatabaseUsage.searches.remaining,
            limit: upcDatabaseUsage.searches.limit,
            percentage: Math.round((upcDatabaseUsage.searches.used / upcDatabaseUsage.searches.limit) * 100)
          },
          lookups: {
            used: upcDatabaseUsage.lookups.used,
            remaining: upcDatabaseUsage.lookups.remaining,
            limit: upcDatabaseUsage.lookups.limit,
            percentage: Math.round((upcDatabaseUsage.lookups.used / upcDatabaseUsage.lookups.limit) * 100)
          }
        }
      },
      totalSearchCapacity: {
        total: upcItemDBUsage.limit + upcDatabaseUsage.searches.limit,
        used: upcItemDBUsage.used + upcDatabaseUsage.searches.used,
        remaining: upcItemDBUsage.remaining + upcDatabaseUsage.searches.remaining
      },
      summary: {
        bestOption: upcDatabaseUsage.searches.remaining > upcItemDBUsage.remaining 
          ? 'UPCDatabase.org' 
          : upcItemDBUsage.remaining > 0 
            ? 'UPCItemDB' 
            : 'No searches remaining',
        recommendation: upcDatabaseUsage.searches.remaining > 0 
          ? 'UPCDatabase.org has more capacity' 
          : upcItemDBUsage.remaining > 0 
            ? 'Use UPCItemDB as fallback'
            : 'Daily limits exceeded for both services'
      }
    })
  } catch (error) {
    console.error('Usage check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check usage',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}