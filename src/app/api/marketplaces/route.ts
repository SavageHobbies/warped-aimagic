import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MARKETPLACE_CONFIGS } from '@/lib/marketplace-config'

// GET /api/marketplaces - List all available marketplaces
export async function GET(request: NextRequest) {
  try {
    // Get existing marketplace configurations from database
    const dbMarketplaces = await prisma.marketplace.findMany({
      orderBy: { name: 'asc' }
    })

    // Merge with default configurations
    const marketplaces = Object.values(MARKETPLACE_CONFIGS).map(defaultConfig => {
      const dbConfig = dbMarketplaces.find(m => m.name === defaultConfig.name)
      
      return {
        id: dbConfig?.id || defaultConfig.id,
        name: defaultConfig.name,
        displayName: defaultConfig.displayName,
        isEnabled: dbConfig?.isEnabled ?? defaultConfig.isEnabled,
        apiConfig: dbConfig?.apiConfig || defaultConfig.apiConfig || {},
        fieldMapping: dbConfig?.fieldMapping || defaultConfig.fieldMapping || {},
        templates: dbConfig?.templates || defaultConfig.templates || {},
        settings: dbConfig?.settings || {},
        createdAt: dbConfig?.createdAt,
        updatedAt: dbConfig?.updatedAt
      }
    })

    return NextResponse.json({ marketplaces })
  } catch (error) {
    console.error('Error fetching marketplaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch marketplaces' },
      { status: 500 }
    )
  }
}

// POST /api/marketplaces - Create or update marketplace configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, displayName, isEnabled, apiConfig, fieldMapping, templates, settings } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Marketplace name is required' },
        { status: 400 }
      )
    }

    // Upsert marketplace configuration
    const marketplace = await prisma.marketplace.upsert({
      where: { name },
      update: {
        displayName,
        isEnabled,
        apiConfig,
        fieldMapping,
        templates,
        settings
      },
      create: {
        name,
        displayName: displayName || name,
        isEnabled: isEnabled ?? true,
        apiConfig,
        fieldMapping,
        templates,
        settings
      }
    })

    return NextResponse.json(marketplace, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating marketplace:', error)
    return NextResponse.json(
      { error: 'Failed to save marketplace configuration' },
      { status: 500 }
    )
  }
}

// PATCH /api/marketplaces - Bulk update marketplace settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { marketplaces } = body

    if (!Array.isArray(marketplaces)) {
      return NextResponse.json(
        { error: 'Marketplaces array is required' },
        { status: 400 }
      )
    }

    const results = []
    
    for (const marketplace of marketplaces) {
      const { name, ...updateData } = marketplace
      
      const updated = await prisma.marketplace.upsert({
        where: { name },
        update: updateData,
        create: {
          name,
          displayName: updateData.displayName || name,
          isEnabled: updateData.isEnabled ?? true,
          ...updateData
        }
      })
      
      results.push(updated)
    }

    return NextResponse.json({ marketplaces: results })
  } catch (error) {
    console.error('Error bulk updating marketplaces:', error)
    return NextResponse.json(
      { error: 'Failed to update marketplaces' },
      { status: 500 }
    )
  }
}