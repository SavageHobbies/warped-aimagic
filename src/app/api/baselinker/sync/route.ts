import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BaseLinkerClient, convertProductToBaseLinker } from '@/lib/baselinker'

// POST /api/baselinker/sync - Sync products to BaseLinker
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, action = 'add' } = body // action: 'add', 'update', 'delete'

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    // Get BaseLinker configuration
    const config = await prisma.baseLinkerConfig.findUnique({
      where: { id: 'default' }
    })

    if (!config || !config.isActive || !config.apiToken) {
      return NextResponse.json(
        { error: 'BaseLinker is not configured or inactive' },
        { status: 400 }
      )
    }

    // Initialize BaseLinker client
    const client = new BaseLinkerClient({ apiToken: config.apiToken })

    // Test connection
    const isConnected = await client.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'BaseLinker connection failed' },
        { status: 500 }
      )
    }

    // Create export job
    const exportJob = await prisma.exportJob.create({
      data: {
        type: 'BASELINKER',
        marketplaceId: 'BASELINKER', // This should be resolved to actual marketplace ID
        productIds: JSON.stringify(productIds),
        status: 'PROCESSING',
        totalItems: productIds.length,
        processedItems: 0
      }
    })

    interface SyncResult {
      productId: string
      baselinkerProductId?: unknown
      title?: string | null
      error?: string
    }

    const results: {
      success: SyncResult[]
      errors: SyncResult[]
    } = {
      success: [],
      errors: []
    }

    try {
      if (action === 'add' || action === 'update') {
        // Fetch products from database
        const products = await prisma.product.findMany({
          where: {
            id: { in: productIds }
          },
          include: {
            images: {
              orderBy: { imageNumber: 'asc' }
            }
          }
        })

        for (const product of products) {
          try {
            const baselinkerProduct = convertProductToBaseLinker(product)
            
            let response
            if (action === 'add') {
              response = await client.addProduct(baselinkerProduct)
            } else {
              // For update, we need the BaseLinker product ID
              // This would typically be stored in your database
              const blProductId = product.sku || product.id
              response = await client.updateProduct(blProductId, baselinkerProduct)
            }

            if (response.status === 'SUCCESS') {
              results.success.push({
                productId: product.id,
                baselinkerProductId: (response.data as { product_id?: unknown })?.product_id,
                title: product.title
              })
            } else {
              results.errors.push({
                productId: product.id,
                title: product.title,
                error: response.error_message || 'Unknown error'
              })
            }
          } catch (productError) {
            results.errors.push({
              productId: product.id,
              title: product.title,
              error: productError instanceof Error ? productError.message : 'Unknown error'
            })
          }
        }
      } else if (action === 'delete') {
        for (const productId of productIds) {
          try {
            // For delete, we need the BaseLinker product ID
            const product = await prisma.product.findUnique({
              where: { id: productId }
            })

            if (!product) {
              results.errors.push({
                productId,
                error: 'Product not found in database'
              })
              continue
            }

            const blProductId = product.sku || product.id
            const response = await client.deleteProduct(blProductId)

            if (response.status === 'SUCCESS') {
              results.success.push({
                productId,
                title: product.title
              })
            } else {
              results.errors.push({
                productId,
                title: product.title,
                error: response.error_message || 'Unknown error'
              })
            }
          } catch (productError) {
            results.errors.push({
              productId,
              error: productError instanceof Error ? productError.message : 'Unknown error'
            })
          }
        }
      }

      // Update export job
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: results.errors.length === 0 ? 'COMPLETED' : 'COMPLETED',
          processedItems: results.success.length + results.errors.length,
          errorMessage: results.errors.length > 0 ? `${results.errors.length} errors occurred` : null,
          completedAt: new Date()
        }
      })

      // Update BaseLinker config last sync time
      await prisma.baseLinkerConfig.update({
        where: { id: 'default' },
        data: { lastSync: new Date() }
      })

      return NextResponse.json({
        success: true,
        exportJobId: exportJob.id,
        results: {
          successCount: results.success.length,
          errorCount: results.errors.length,
          success: results.success,
          errors: results.errors
        }
      })

    } catch (syncError) {
      // Update export job with failure
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'FAILED',
          errorMessage: syncError instanceof Error ? syncError.message : 'Unknown sync error',
          completedAt: new Date()
        }
      })

      throw syncError
    }
  } catch (error) {
    console.error('BaseLinker sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with BaseLinker' },
      { status: 500 }
    )
  }
}

// GET /api/baselinker/sync - Get sync status and history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [syncJobs, total] = await Promise.all([
      prisma.exportJob.findMany({
        where: {
          type: 'BASELINKER'
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.exportJob.count({
        where: {
          type: 'BASELINKER'
        }
      })
    ])

    // Get last sync time
    const config = await prisma.baseLinkerConfig.findUnique({
      where: { id: 'default' }
    })

    return NextResponse.json({
      syncJobs,
      lastSync: config?.lastSync,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching BaseLinker sync history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    )
  }
}