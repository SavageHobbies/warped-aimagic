import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BaseLinkerClient, convertProductToBaseLinker, convertBaseLinkerToProduct } from '@/lib/baselinker'

// POST /api/baselinker/config - Set up BaseLinker configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiToken, settings } = body

    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token is required' },
        { status: 400 }
      )
    }

    // Test the connection first
    const client = new BaseLinkerClient({ apiToken })
    const isConnected = await client.testConnection()

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Invalid API token or BaseLinker connection failed' },
        { status: 400 }
      )
    }

    // Save or update the configuration
    const config = await prisma.baseLinkerConfig.upsert({
      where: { id: 'default' },
      update: {
        apiToken,
        isActive: true,
        settings,
        lastSync: new Date()
      },
      create: {
        id: 'default',
        apiToken,
        isActive: true,
        settings,
        lastSync: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'BaseLinker configuration saved successfully',
      isConnected: true
    })
  } catch (error) {
    console.error('BaseLinker config error:', error)
    return NextResponse.json(
      { error: 'Failed to configure BaseLinker' },
      { status: 500 }
    )
  }
}

// GET /api/baselinker/config - Get BaseLinker configuration status
export async function GET(request: NextRequest) {
  try {
    const config = await prisma.baseLinkerConfig.findUnique({
      where: { id: 'default' }
    })

    if (!config) {
      return NextResponse.json({
        isConfigured: false,
        isActive: false
      })
    }

    // Test current connection
    let isConnected = false
    if (config.isActive && config.apiToken) {
      try {
        const client = new BaseLinkerClient({ apiToken: config.apiToken })
        isConnected = await client.testConnection()
      } catch (error) {
        console.error('BaseLinker connection test failed:', error)
      }
    }

    return NextResponse.json({
      isConfigured: true,
      isActive: config.isActive,
      isConnected,
      lastSync: config.lastSync,
      settings: config.settings
    })
  } catch (error) {
    console.error('Error fetching BaseLinker config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BaseLinker configuration' },
      { status: 500 }
    )
  }
}