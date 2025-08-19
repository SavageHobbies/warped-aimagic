import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ebayService } from '@/lib/ebay'

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = readableStream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest, { params }: { params: { videoId: string } }) {
  const { videoId } = params;

  if (!ebayService.isConfigured()) {
    return NextResponse.json({ error: 'eBay service not configured' }, { status: 503 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'No video file provided in request body' }, { status: 400 });
  }

  try {
    // 1. Get the video data from the request body
    const videoBuffer = await streamToBuffer(request.body);

    // 2. Upload the video to eBay
    const success = await ebayService.uploadVideo(videoId, videoBuffer);
    if (!success) {
      throw new Error('eBay video upload failed');
    }

    // 3. Update the video status in our database
    await prisma.productVideo.update({
      where: { ebayVideoId: videoId },
      data: {
        status: 'PROCESSING',
      },
    });

    return NextResponse.json({ message: 'Video uploaded successfully, now processing.' });
  } catch (error) {
    console.error(`Failed to upload video ${videoId}:`, error);
    // Attempt to mark as failed in DB
    try {
      await prisma.productVideo.update({
        where: { ebayVideoId: videoId },
        data: { status: 'UPLOAD_FAILED' },
      });
    } catch (dbError) {
      console.error(`Failed to update video status to FAILED for ${videoId}:`, dbError);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload video', details: errorMessage },
      { status: 500 }
    );
  }
}
