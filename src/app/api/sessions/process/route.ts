import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session } = body

    if (!session || !session.items || session.items.length === 0) {
      return NextResponse.json({ error: 'No session data or items provided' }, { status: 400 })
    }

    console.log(`Processing session with ${session.items.length} items`)

    // Create a scan session in the database
    const dbSession = await prisma.scanSession.create({
      data: {
        sessionId: session.id || `session_${Date.now()}`,
        status: 'completed'
      }
    })

    // Process each item in the session
    const processedItems = []
    for (const item of session.items) {
      try {
        // Find or create the product
        let product = await prisma.product.findUnique({
          where: { upc: item.upc }
        })

        if (!product) {
          // Create a basic product record if it doesn't exist
          product = await prisma.product.create({
            data: {
              upc: item.upc,
              title: item.title || `Product ${item.upc}`,
              description: item.description,
              brand: item.brand,
              quantity: item.quantity,
              condition: 'New',
              lastScanned: new Date()
            }
          })
        } else {
          // Update quantity for existing product
          await prisma.product.update({
            where: { id: product.id },
            data: {
              quantity: { increment: item.quantity },
              lastScanned: new Date()
            }
          })
        }

        processedItems.push({
          upc: item.upc,
          title: item.title || product.title,
          quantity: item.quantity,
          status: 'processed'
        })

        console.log(`Processed item: ${item.upc} (quantity: ${item.quantity})`)
      } catch (itemError) {
        console.error(`Error processing item ${item.upc}:`, itemError)
        processedItems.push({
          upc: item.upc,
          quantity: item.quantity,
          status: 'error',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedItems.length} items`,
      sessionId: dbSession.id,
      processedItems,
      summary: {
        totalItems: session.totalItems,
        uniqueItems: session.uniqueItems,
        processed: processedItems.filter(item => item.status === 'processed').length,
        errors: processedItems.filter(item => item.status === 'error').length
      }
    })

  } catch (error) {
    console.error('Error processing session:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
