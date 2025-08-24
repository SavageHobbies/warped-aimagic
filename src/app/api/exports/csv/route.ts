import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CSVExporter } from '@/lib/csv-exporter'
import { join } from 'path'
import { createReadStream, existsSync } from 'fs'

// POST /api/exports/csv - Generate CSV export for selected products and marketplace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productIds, marketplace, customFields, filename } = body

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    if (!marketplace) {
      return NextResponse.json(
        { error: 'Marketplace is required' },
        { status: 400 }
      )
    }

    // Fetch products with all related data
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      },
      include: {
        images: {
          orderBy: { imageNumber: 'asc' }
        },
        categories: {
          include: {
            category: true
          }
        },
        aiContent: true
      }
    })

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'No products found' },
        { status: 404 }
      )
    }

    // Create export job record
    const exportJob = await prisma.exportJob.create({
      data: {
        type: 'CSV',
        marketplaceId: marketplace, // This should be resolved to actual marketplace ID
        productIds: JSON.stringify(productIds),
        status: 'PROCESSING',
        totalItems: products.length,
        processedItems: 0
      }
    })

    try {
      // Initialize CSV exporter
      const exporter = new CSVExporter('./public/exports')
      
      // Transform products to match CSVExporter interface (convert null to undefined)
      const transformedProducts = products.map(product => {
        // Handle dimensions - parse if it's a JSON object
        let dimensions: { length?: number; width?: number; height?: number } | undefined
        if (product.dimensions && typeof product.dimensions === 'object') {
          try {
            const dims = product.dimensions as Record<string, unknown>
            dimensions = {
              length: typeof dims.length === 'number' ? dims.length : undefined,
              width: typeof dims.width === 'number' ? dims.width : undefined,
              height: typeof dims.height === 'number' ? dims.height : undefined
            }
          } catch {
            dimensions = undefined
          }
        }

        return {
          id: product.id,
          title: product.title || undefined,
          description: product.description || undefined,
          upc: product.upc || undefined,
          ean: product.ean || undefined,
          sku: product.sku || undefined,
          brand: product.brand || undefined,
          model: product.model || undefined,
          mpn: product.mpn || undefined,
          color: product.color || undefined,
          size: product.size || undefined,
          condition: product.condition || undefined,
          weight: product.weight || undefined,
          price: product.price || undefined,
          lowestRecordedPrice: product.lowestRecordedPrice || undefined,
          quantity: product.quantity || undefined,
          dimensions,
          images: product.images.map(img => ({
            originalUrl: img.originalUrl || undefined,
            url: img.url || undefined
          }))
        }
      })
      
      // Generate CSV
      const result = exporter.exportToCSV({
        marketplace,
        products: transformedProducts,
        customFields,
        filename
      })

      if (result.success) {
        // Update export job with success
        await prisma.exportJob.update({
          where: { id: exportJob.id },
          data: {
            status: 'COMPLETED',
            fileName: result.filename,
            filePath: result.filePath,
            processedItems: result.rowCount || 0,
            completedAt: new Date()
          }
        })

        // Generate download URL
        const downloadUrl = `/api/exports/csv/download/${exportJob.id}`

        return NextResponse.json({
          success: true,
          exportJobId: exportJob.id,
          filename: result.filename,
          downloadUrl,
          productCount: result.rowCount
        })
      } else {
        // Update export job with failure
        await prisma.exportJob.update({
          where: { id: exportJob.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error,
            completedAt: new Date()
          }
        })

        return NextResponse.json(
          { error: result.error || 'Export failed' },
          { status: 500 }
        )
      }
    } catch (exportError) {
      // Update export job with failure
      await prisma.exportJob.update({
        where: { id: exportJob.id },
        data: {
          status: 'FAILED',
          errorMessage: exportError instanceof Error ? exportError.message : 'Unknown export error',
          completedAt: new Date()
        }
      })

      throw exportError
    }
  } catch (error) {
    console.error('CSV Export Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV export' },
      { status: 500 }
    )
  }
}

// GET /api/exports/csv - List export jobs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [exportJobs, total] = await Promise.all([
      prisma.exportJob.findMany({
        where: {
          type: 'CSV'
        },
        include: {
          marketplace: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.exportJob.count({
        where: {
          type: 'CSV'
        }
      })
    ])

    return NextResponse.json({
      exportJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching export jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export jobs' },
      { status: 500 }
    )
  }
}