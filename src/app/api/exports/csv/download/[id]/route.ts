import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createReadStream, existsSync } from 'fs'
import { join } from 'path'

// GET /api/exports/csv/download/[id] - Download CSV file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Find the export job
    const exportJob = await prisma.exportJob.findUnique({
      where: { id },
      include: {
        marketplace: true
      }
    })

    if (!exportJob) {
      return NextResponse.json(
        { error: 'Export job not found' },
        { status: 404 }
      )
    }

    if (exportJob.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Export job is not completed' },
        { status: 400 }
      )
    }

    if (!exportJob.filePath || !exportJob.fileName) {
      return NextResponse.json(
        { error: 'Export file not found' },
        { status: 404 }
      )
    }

    // Check if file exists
    if (!existsSync(exportJob.filePath)) {
      return NextResponse.json(
        { error: 'Export file has been deleted or moved' },
        { status: 404 }
      )
    }

    try {
      // Read the file
      const fileBuffer = await import('fs/promises').then(fs => 
        fs.readFile(exportJob.filePath!)
      )

      // Set appropriate headers for CSV download
      const headers = new Headers({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${exportJob.fileName}"`,
        'Content-Length': String(fileBuffer.length)
      })

      return new Response(new Uint8Array(fileBuffer), { headers })
    } catch (fileError) {
      console.error('Error reading export file:', fileError)
      return NextResponse.json(
        { error: 'Failed to read export file' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error downloading CSV:', error)
    return NextResponse.json(
      { error: 'Failed to download CSV file' },
      { status: 500 }
    )
  }
}