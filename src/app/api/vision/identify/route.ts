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

    // Use Gemini Vision to identify products in the image
    const result = await geminiVisionService.identifyProducts(image, mimeType || 'image/jpeg')

    return NextResponse.json(result)
  } catch (error) {
    console.error('Vision identification error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to identify products',
        candidates: [],
        extractedText: '',
        imageDescription: 'Unable to analyze image'
      },
      { status: 500 }
    )
  }
}
