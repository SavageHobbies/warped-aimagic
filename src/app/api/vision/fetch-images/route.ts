import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ImageFetchRequest {
  upc: string
  productTitle: string
  productId: string
}

// Function to search for product images from various sources
async function searchProductImages(upc: string, productTitle: string): Promise<string[]> {
  const imageUrls: string[] = []
  try {
    // Try UPCItemDB API first (if available)
    if (process.env.UPCITEMDB_API_KEY) {
      try {
        const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, {
          headers: {
            'user_key': process.env.UPCITEMDB_API_KEY,
            'Accept': 'application/json'
          }
        })
        if (upcResponse.ok) {
          const upcData = await upcResponse.json()
          if (upcData.items && upcData.items.length > 0) {
            const item = upcData.items[0]
            if (item.images && item.images.length > 0) {
              imageUrls.push(...item.images.slice(0, 3)) // Max 3 images from UPC
            }
          }
        }
      } catch (error) {
        console.log('UPCItemDB lookup failed:', error)
      }
    }

    // If no images from UPC, try Google Custom Search API (CSE)
    if (imageUrls.length === 0 && process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_CX) {
      try {
        const searchQuery = encodeURIComponent(productTitle + ' product image')
        const googleUrl = `https://www.googleapis.com/customsearch/v1?q=${searchQuery}&cx=${process.env.GOOGLE_CSE_CX}&key=${process.env.GOOGLE_CSE_KEY}&searchType=image&num=5`;
        const googleResponse = await fetch(googleUrl);
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          if (googleData.items && Array.isArray(googleData.items)) {
            for (const img of googleData.items.slice(0, 3)) {
              if (img.link) imageUrls.push(img.link);
            }
          }
        } else {
          console.log('Google CSE Image Search failed:', await googleResponse.text());
        }
      } catch (error) {
        console.log('Google CSE Image Search error:', error);
      }
    } else if (imageUrls.length === 0) {
      console.log('No Google CSE API key or CSE ID set, cannot perform image search.');
    }
  } catch (error) {
    console.error('Error in searchProductImages:', error)
  }
  return imageUrls
  return imageUrls
}

export async function POST(request: NextRequest) {
  console.log('API /api/vision/fetch-images POST called')
  try {
    const { upc, productTitle, productId }: ImageFetchRequest = await request.json()
    
    if (!upc || !productTitle || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: upc, productTitle, and productId' },
        { status: 400 }
      )
    }
    
    console.log(`Fetching images for product: ${productTitle} (UPC: ${upc})`)
    
    // Search for images
    const imageUrls = await searchProductImages(upc, productTitle)
    
    let imagesAdded = 0
    const newImages = []
    // Add images to the product if found
    if (imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i]
        try {
          // Validate that the URL is accessible
          const imageResponse = await fetch(imageUrl, { method: 'HEAD' })
          if (imageResponse.ok) {
            // Add image to product
            const created = await prisma.productImage.create({
              data: {
                productId: productId,
                originalUrl: imageUrl,
                imageNumber: i + 1,
                uploadStatus: 'completed'
              }
            })
            newImages.push(created)
            imagesAdded++
            console.log(`Added image ${i + 1} for ${productTitle}: ${imageUrl}`)
          } else {
            console.log(`Image URL not accessible: ${imageUrl}`)
          }
        } catch (error) {
          console.log(`Failed to validate/add image ${imageUrl}:`, error)
        }
      }
    }
    return NextResponse.json({
      success: true,
      message: `Found and added ${imagesAdded} images`,
      imagesAdded,
      productId,
      images: newImages
    })
    
  } catch (error) {
    console.error('Image fetch error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}