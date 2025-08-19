import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ebayService } from '@/lib/ebay'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const productId = params.id

  if (!ebayService.isConfigured()) {
    return NextResponse.json({ error: 'eBay service not configured' }, { status: 503 });
  }

  try {
    const { title, size, description } = await request.json();

    if (!title || !size) {
      return NextResponse.json({ error: 'title and size are required' }, { status: 400 });
    }

    // 1. Create video resource on eBay
    const ebayVideo = await ebayService.createVideo(title, size, description);
    if (!ebayVideo || !ebayVideo.videoId) {
      throw new Error('Failed to create video resource on eBay');
    }

    // 2. Save video metadata to our database
    const newVideo = await prisma.productVideo.create({
      data: {
        productId: productId,
        ebayVideoId: ebayVideo.videoId,
        title: title,
        description: description,
        size: size,
        status: 'PENDING_UPLOAD',
      },
    });

    return NextResponse.json(newVideo);
  } catch (error) {
    console.error(`Failed to create video for product ${productId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create video', details: errorMessage },
      { status: 500 }
    );
  }
}
