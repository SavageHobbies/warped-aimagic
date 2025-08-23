import { NextRequest, NextResponse } from 'next/server'
import { geminiVisionService } from '@/lib/geminiVision'

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Use Gemini Vision to extract text and look for barcodes/UPCs
    const result = await geminiVisionService.extractProductText(image, mimeType || 'image/jpeg')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vision text extraction error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract text from image',
        text: '',
        barcode: null,
        productInfo: {}
      },
      { status: 500 }
    )
  }
}