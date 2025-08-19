import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Creating new product with data:', body)

    // Extract the main product data
    const {
      upc,
      ean,
      gtin,
      sku,
      title,
      description,
      brand,
      model,
      mpn,
      color,
      size,
      weight,
      weightUnit,
      dimensions,
      material,
      condition = 'new',
      quantity = 1,
      currency = 'USD',
      lowestRecordedPrice,
      highestRecordedPrice,
      images = [],
      categories = [],
      offers = [],
      // Additional fields
      ageGroup,
      character,
      exclusivity,
      features,
      funkoPop,
      isbn,
      itemHeight,
      itemLength,
      itemWidth,
      releaseDate,
      series,
      theme,
      // Fields that might come from AI or external sources
      aiDescription,
      aiCategory,
      aiAttributes,
      confidence
    } = body

    // Validate required fields
    if (!upc && !ean && !gtin && !isbn) {
      return NextResponse.json(
        { error: 'At least one identifier (UPC, EAN, GTIN, or ISBN) is required' },
        { status: 400 }
      )
    }

    // Check if product already exists
    const orConditions = []
    if (upc) orConditions.push({ upc })
    if (ean) orConditions.push({ ean })
    if (gtin) orConditions.push({ gtin })
    if (isbn) orConditions.push({ isbn })

    const existingProduct = orConditions.length > 0
      ? await prisma.product.findFirst({
          where: { OR: orConditions }
        })
      : null

    if (existingProduct) {
      // Update existing product instead of creating duplicate
      const updatedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          title: title || existingProduct.title,
          description: description || existingProduct.description,
          brand: brand || existingProduct.brand,
          model: model || existingProduct.model,
          mpn: mpn || existingProduct.mpn,
          color: color || existingProduct.color,
          size: size || existingProduct.size,
          weight: weight || existingProduct.weight,
          weightUnit: weightUnit || existingProduct.weightUnit,
          dimensions: dimensions || existingProduct.dimensions,
          material: material || existingProduct.material,
          condition: condition || existingProduct.condition,
          quantity: quantity || existingProduct.quantity,
          currency: currency || existingProduct.currency,
          lowestRecordedPrice: lowestRecordedPrice || existingProduct.lowestRecordedPrice,
          highestRecordedPrice: highestRecordedPrice || existingProduct.highestRecordedPrice,
          lastScanned: new Date(),
          // Additional fields
          ageGroup: ageGroup || existingProduct.ageGroup,
          character: character || existingProduct.character,
          exclusivity: exclusivity || existingProduct.exclusivity,
          features: features || existingProduct.features,
          funkoPop: funkoPop ?? existingProduct.funkoPop,
          itemHeight: itemHeight || existingProduct.itemHeight,
          itemLength: itemLength || existingProduct.itemLength,
          itemWidth: itemWidth || existingProduct.itemWidth,
          releaseDate: releaseDate || existingProduct.releaseDate,
          series: series || existingProduct.series,
          theme: theme || existingProduct.theme
        },
        include: {
          images: true,
          offers: true,
          categories: {
            include: {
              category: true
            }
          },
          aiContent: true
        }
      })

      return NextResponse.json({
        product: updatedProduct,
        message: 'Product updated successfully',
        isUpdate: true
      })
    }

    // Create new product
    const newProduct = await prisma.product.create({
      data: {
        upc: upc || null,
        ean: ean || null,
        gtin: gtin || null,
        isbn: isbn || null,
        sku: sku || null,
        title: title || `Product ${upc || ean || gtin || isbn}`,
        description: description || aiDescription || null,
        brand: brand || null,
        model: model || null,
        mpn: mpn || null,
        color: color || null,
        size: size || null,
        weight: weight || null,
        weightUnit: weightUnit || 'lb',
        dimensions: dimensions || null,
        material: material || null,
        condition: condition,
        quantity: quantity,
        currency: currency,
        lowestRecordedPrice: lowestRecordedPrice || null,
        highestRecordedPrice: highestRecordedPrice || null,
        lastScanned: new Date(),
        // Additional fields
        ageGroup: ageGroup || null,
        character: character || null,
        exclusivity: exclusivity || null,
        features: features || null,
        funkoPop: funkoPop || false,
        itemHeight: itemHeight || null,
        itemLength: itemLength || null,
        itemWidth: itemWidth || null,
        releaseDate: releaseDate || null,
        series: series || null,
        theme: theme || null,
        // Create related records
        images: {
          create: images.map((img: any, index: number) => ({
            originalUrl: img.originalUrl || img.url,
            localPath: img.localPath || null,
            imageNumber: index + 1
          }))
        },
        offers: {
          create: offers.map((offer: any) => ({
            merchant: offer.merchant || 'Unknown',
            price: offer.price || null,
            listPrice: offer.listPrice || null,
            currency: offer.currency || 'USD',
            condition: offer.condition || null,
            availability: offer.availability || null,
            link: offer.link || null
          }))
        }
      },
      include: {
        images: true,
        offers: true,
        categories: {
          include: {
            category: true
          }
        },
        aiContent: true
      }
    })

    // If we have category information, create category associations
    if (aiCategory || categories.length > 0) {
      const categoryData = categories.length > 0 
        ? categories 
        : [aiCategory].filter(Boolean)

      for (const catData of categoryData) {
        if (catData) {
          // Extract category name from object or use string directly
          const categoryName = typeof catData === 'object' && catData.name 
            ? catData.name 
            : typeof catData === 'string' 
              ? catData 
              : null
          
          if (!categoryName) continue
          
          // Find or create category
          let category = await prisma.category.findFirst({
            where: {
              OR: [
                { name: categoryName },
                { fullPath: categoryName }
              ]
            }
          })

          if (!category) {
            category = await prisma.category.create({
              data: {
                name: categoryName,
                fullPath: categoryName,
                type: 'general'  // Default type for categories
              }
            })
          }

          // Create product-category association
          await prisma.productCategory.create({
            data: {
              productId: newProduct.id,
              categoryId: category.id,
              isPrimary: categoryData.indexOf(catData) === 0
            }
          }).catch(err => {
            console.log('Category association already exists or error:', err.message)
          })
        }
      }
    }

    // Refetch product with all relations
    const productWithRelations = await prisma.product.findUnique({
      where: { id: newProduct.id },
      include: {
        images: true,
        offers: true,
        categories: {
          include: {
            category: true
          }
        },
        aiContent: true
      }
    })

    console.log('Product created successfully:', productWithRelations?.id)

    return NextResponse.json({
      product: productWithRelations,
      message: 'Product created successfully',
      isUpdate: false
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create product',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET all products (with pagination and filtering)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const brand = searchParams.get('brand') || ''
    const condition = searchParams.get('condition') || ''
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { upc: { contains: search } },
        { ean: { contains: search } },
        { isbn: { contains: search } }
      ]
    }
    
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' }
    }
    
    if (condition) {
      where.condition = condition
    }
    
    if (category) {
      where.categories = {
        some: {
          category: {
            OR: [
              { name: { contains: category, mode: 'insensitive' } },
              { fullPath: { contains: category, mode: 'insensitive' } }
            ]
          }
        }
      }
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        images: {
          orderBy: { imageNumber: 'asc' },
          take: 1
        },
        categories: {
          include: {
            category: true
          }
        },
        aiContent: {
          select: {
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
