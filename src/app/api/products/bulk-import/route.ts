import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiBaseUrl } from '@/lib/config'

// Import result interfaces
interface ImportResult {
  success: boolean
  totalRows: number
  processed: number
  created: number
  updated: number
  errors: Array<{
    row: number
    error: string
    data?: any
  }>
}

// Simple validation function
function validateProductRow(productData: any, rowNumber: number): any {
  const errors = []
  
  if (!productData.title || typeof productData.title !== 'string' || productData.title.trim() === '') {
    errors.push(`Row ${rowNumber}: Title is required and cannot be empty`)
  }
  
  if (productData.quantity !== undefined && (isNaN(productData.quantity) || productData.quantity < 0)) {
    errors.push(`Row ${rowNumber}: Quantity must be a positive number`)
  }
  
  if (productData.price !== undefined && productData.price !== null && productData.price !== '' && (isNaN(productData.price) || productData.price < 0)) {
    errors.push(`Row ${rowNumber}: Price must be a positive number`)
  }
  
  if (productData.cost !== undefined && productData.cost !== null && productData.cost !== '' && (isNaN(productData.cost) || productData.cost < 0)) {
    errors.push(`Row ${rowNumber}: Cost must be a positive number`)
  }
  
  if (productData.weight !== undefined && productData.weight !== null && productData.weight !== '' && (isNaN(productData.weight) || productData.weight < 0)) {
    errors.push(`Row ${rowNumber}: Weight must be a positive number`)
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join(', '))
  }
  
  // Return validated data with defaults
  return {
    title: productData.title?.trim(),
    upc: productData.upc?.trim() || undefined,
    ean: productData.ean?.trim() || undefined,
    sku: productData.sku?.trim() || undefined,
    brand: productData.brand?.trim() || undefined,
    model: productData.model?.trim() || undefined,
    category: productData.category?.trim() || undefined,
    condition: productData.condition || 'New',
    quantity: productData.quantity || 1,
    price: productData.price || undefined,
    cost: productData.cost || undefined,
    description: productData.description?.trim() || undefined,
    color: productData.color?.trim() || undefined,
    size: productData.size?.trim() || undefined,
    weight: productData.weight || undefined,
    dimensions: productData.dimensions?.trim() || undefined
  }
}

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/)
  const result: string[][] = []
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    if (line.trim() === '') continue
    
    const row: string[] = []
    let current = ''
    let inQuotes = false
    let quoteCount = 0
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        quoteCount++
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    // Add the last field
    row.push(current.trim())
    
    // Validate row integrity
    if (inQuotes) {
      console.warn(`⚠️ Row ${lineIndex + 1}: Unclosed quotes detected. Quote count: ${quoteCount}`)
      console.warn(`Raw line: ${line.substring(0, 100)}...`)
    }
    
    // Check for suspicious field content
    for (let fieldIndex = 0; fieldIndex < row.length; fieldIndex++) {
      const field = row[fieldIndex]
      if (field.includes('\n') || field.includes('\r')) {
        console.warn(`⚠️ Row ${lineIndex + 1}, Field ${fieldIndex}: Contains line breaks`)
      }
      if (field.length > 1000) {
        console.warn(`⚠️ Row ${lineIndex + 1}, Field ${fieldIndex}: Unusually long field (${field.length} chars)`)
      }
    }
    
    result.push(row)
  }
  
  return result
}

// Intelligent column detection based on content patterns
function analyzeColumns(row: string[], headers: string[]): {
  titleColumn: number,
  upcColumn: number,
  priceColumn: number,
  brandColumn: number,
  quantityColumn: number,
  imageColumns: number[]
} {
  const analysis = {
    titleColumn: -1,
    upcColumn: -1,
    priceColumn: -1,
    brandColumn: -1,
    quantityColumn: -1,
    imageColumns: [] as number[]
  }
  
  for (let i = 0; i < headers.length && i < row.length; i++) {
    const header = headers[i]?.toLowerCase().trim()
    const value = row[i]?.trim() || ''
    
    // Detect title column - look for descriptive text that's not a URL
    if ((header.includes('title') || header.includes('name') || header.includes('product')) &&
        !header.includes('image') && 
        value.length > 10 && 
        !value.startsWith('http') &&
        !value.match(/^\d+$/) && // not just numbers
        !value.match(/^\d+\.\d+$/) // not price format
    ) {
      if (analysis.titleColumn === -1 || header.includes('title')) {
        analysis.titleColumn = i
      }
    }
    
    // Detect UPC column - looks for 12-13 digit numbers
    if ((header.includes('upc') || header.includes('barcode')) && value.match(/^\d{12,13}$/)) {
      analysis.upcColumn = i
    }
    
    // Detect price column - looks for numeric values with optional currency symbols
    if ((header.includes('price') || header.includes('cost')) && 
        value.match(/^\$?[\d,]+\.?\d*$/)) {
      if (analysis.priceColumn === -1 || header === 'price' || header === 'regular price') {
        analysis.priceColumn = i
      }
    }
    
    // Detect brand column
    if (header.includes('brand') && value.length > 0 && value.length < 50) {
      analysis.brandColumn = i
    }
    
    // Detect quantity column
    if ((header.includes('quantity') || header.includes('qty') || header.includes('stock')) && 
        value.match(/^\d+$/)) {
      analysis.quantityColumn = i
    }
    
    // Detect image columns - contain URLs
    if ((header.includes('image') || header.includes('picture') || header.includes('photo') || 
         value.includes('http')) && value.includes('http')) {
      analysis.imageColumns.push(i)
    }
  }
  
  return analysis
}

// Enhanced mapping function for CPI format with intelligent column detection
function mapCPIRowToProduct(row: string[], headers: string[]): any {
  const product: any = {}
  const imageUrls: string[] = []
  
  console.log('Processing CPI row with', headers.length, 'headers and', row.length, 'values')
  console.log('Headers:', headers)
  console.log('First 10 values:', row.slice(0, 10))
  
  // First pass: detect potential column purposes based on content patterns
  const columnAnalysis = analyzeColumns(row, headers)
  console.log('Column analysis:', columnAnalysis)
  
  // Use detected columns
  if (columnAnalysis.titleColumn !== -1) {
    product.title = row[columnAnalysis.titleColumn]?.trim()
    console.log(`Using column ${columnAnalysis.titleColumn} ("${headers[columnAnalysis.titleColumn]}") for title: "${product.title}"`)
  }
  
  if (columnAnalysis.upcColumn !== -1) {
    product.upc = row[columnAnalysis.upcColumn]?.trim()
  }
  
  if (columnAnalysis.priceColumn !== -1) {
    const priceStr = row[columnAnalysis.priceColumn]?.trim()
    const price = parseFloat(priceStr?.replace(/[$,]/g, '') || '0')
    if (!isNaN(price) && price >= 0) {
      product.price = price
    }
  }
  
  if (columnAnalysis.brandColumn !== -1) {
    product.brand = row[columnAnalysis.brandColumn]?.trim()
  }
  
  if (columnAnalysis.quantityColumn !== -1) {
    const qty = parseInt(row[columnAnalysis.quantityColumn]?.trim() || '1')
    if (!isNaN(qty) && qty >= 0) {
      product.quantity = qty
    }
  }
  
  // Process image columns
  columnAnalysis.imageColumns.forEach(colIndex => {
    const value = row[colIndex]?.trim()
    if (value && value.includes('http')) {
      if (value.includes(',')) {
        const urls = value.split(',').map(url => url.trim()).filter(url => url.startsWith('http'))
        imageUrls.push(...urls)
      } else {
        imageUrls.push(value)
      }
    }
  })
  
  // Fallback to original mapping for any unmapped fields
  for (let i = 0; i < headers.length && i < row.length; i++) {
    const header = headers[i]?.toLowerCase().trim()
    const value = row[i]?.trim()
    
    // Skip empty values
    if (!value || value === '' || !header) continue
    
    // Handle specific CPI format columns that weren't detected above
    switch (header) {
      case 'ean':
      case 'gtin':
        if (!product.ean) product.ean = value
        break
        
      case 'sku':
        if (!product.sku) product.sku = value
        break
        
      case 'condition':
        if (!product.condition) product.condition = value || 'New'
        break
        
      case 'description':
      case 'short description':
      case 'long description':
        if (!product.description || header === 'long description') {
          product.description = value
        }
        break
        
      case 'model':
        if (!product.model) product.model = value
        break
        
      case 'color':
        if (!product.color) product.color = value
        break
        
      case 'size':
        if (!product.size) product.size = value
        break
        
      case 'dimensions':
        if (!product.dimensions) product.dimensions = value
        break
        
      case 'weight (unit)':
        if (!product.weight) {
          const weight = parseFloat(value.replace(/[^0-9.]/g, ''))
          if (!isNaN(weight) && weight >= 0) {
            product.weight = weight
          }
        }
        break
        
      // Skip personal data fields
      case 'seller':
      case 'owner':
      case 'user':
      case 'person':
        console.log(`Skipping personal data field: ${header} = ${value}`)
        break
        
      default:
        // Debug: Log ALL unmapped fields to identify the issue
        console.log(`Column ${i}: "${header}" = "${value.length > 50 ? value.substring(0, 50) + '...' : value}"`)
        break
    }
  }
  
  // Add images array if we found any
  if (imageUrls.length > 0) {
    product.imageUrls = imageUrls.slice(0, 10) // Limit to 10 images
  }
  
  console.log('Mapped CPI product:', {
    title: product.title,
    upc: product.upc,
    brand: product.brand,
    price: product.price,
    images: product.imageUrls?.length || 0
  })
  
  return product
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    
    if (!allowedTypes.includes(file.type) && !['csv', 'xls', 'xlsx'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      )
    }
    
    // Read file content
    const fileContent = await file.text()
    const rows = parseCSV(fileContent)
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 }
      )
    }
    
    // Get headers (first row)
    const headers = rows[0].map(h => h.toLowerCase().trim())
    const dataRows = rows.slice(1)
    
    console.log(`📊 CSV Analysis: ${headers.length} columns, ${dataRows.length} data rows`)
    
    // Validate column consistency
    const expectedColumnCount = headers.length
    const problematicRows: Array<{row: number, expected: number, actual: number, data: string[]}> = []
    
    dataRows.forEach((row, index) => {
      if (row.length !== expectedColumnCount) {
        problematicRows.push({
          row: index + 2, // +2 for header and 0-based indexing
          expected: expectedColumnCount,
          actual: row.length,
          data: row
        })
      }
    })
    
    if (problematicRows.length > 0) {
      console.warn(`⚠️ Found ${problematicRows.length} rows with column count mismatches:`)
      problematicRows.slice(0, 5).forEach(prob => {
        console.warn(`  Row ${prob.row}: Expected ${prob.expected} columns, got ${prob.actual}`)
        console.warn(`    First 3 fields: ["${prob.data.slice(0, 3).join('", "')}"]`)
      })
    }
    
    const result: ImportResult = {
      success: true,
      totalRows: dataRows.length,
      processed: 0,
      created: 0,
      updated: 0,
      errors: []
    }
    
    let skippedEmptyRows = 0
    
    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNumber = i + 2 // +2 because we skip header and array is 0-based
      
      try {
        // Validate row structure before processing
        if (row.length !== headers.length) {
          throw new Error(`Column count mismatch: expected ${headers.length}, got ${row.length}. This may indicate malformed CSV data with unescaped commas or quotes.`)
        }
        
        // Skip empty rows more thoroughly
        if (row.every(cell => !cell?.trim())) {
          skippedEmptyRows++
          continue
        }
        
        // Also skip rows that have no meaningful data (all cells empty or just whitespace)
        const hasData = row.some(cell => cell && cell.trim().length > 0)
        if (!hasData) {
          skippedEmptyRows++
          continue
        }
        
        // Map CSV row to product data using CPI-specific mapper
        const productData = mapCPIRowToProduct(row, headers)
        
        // Enhanced validation for product data
        if (!productData.title || productData.title.trim() === '') {
          console.warn(`⚠️ Row ${rowNumber}: No title found after mapping. Row data: [${row.slice(0, 5).map(r => `"${r}"`).join(', ')}...]`)
          skippedEmptyRows++
          continue
        }
        
        // Check for suspicious title content
        if (productData.title.startsWith('http') || productData.title.includes('.jpg') || productData.title.includes('.png')) {
          console.warn(`⚠️ Row ${rowNumber}: Title appears to be an image URL: "${productData.title.substring(0, 50)}..."`)
          console.warn(`  This suggests column mapping issues. Full row: [${row.slice(0, 5).map(r => `"${r}"`).join(', ')}...]`)
        }
        
        // Validate product data
        const validatedData = validateProductRow(productData, rowNumber)
        
        // Check if product exists (by UPC, EAN, or SKU)
        const whereConditions = []
        if (validatedData.upc) whereConditions.push({ upc: validatedData.upc })
        if (validatedData.ean) whereConditions.push({ ean: validatedData.ean })
        if (validatedData.sku) whereConditions.push({ sku: validatedData.sku })
        
        let existingProduct = null
        if (whereConditions.length > 0) {
          existingProduct = await prisma.product.findFirst({
            where: { OR: whereConditions }
          })
        }
        
        if (existingProduct) {
          // Update existing product
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              title: validatedData.title || existingProduct.title,
              brand: validatedData.brand || existingProduct.brand,
              model: validatedData.model || existingProduct.model,
              category: validatedData.category || existingProduct.category,
              condition: validatedData.condition || existingProduct.condition,
              quantity: validatedData.quantity,
              price: validatedData.price || existingProduct.price,
              cost: validatedData.cost || existingProduct.cost,
              description: validatedData.description || existingProduct.description,
              color: validatedData.color || existingProduct.color,
              size: validatedData.size || existingProduct.size,
              weight: validatedData.weight || existingProduct.weight,
              updatedAt: new Date()
            }
          })
          result.updated++
        } else {
          // Create new product
          const createdProduct = await prisma.product.create({
            data: {
              upc: validatedData.upc,
              ean: validatedData.ean,
              sku: validatedData.sku,
              title: validatedData.title,
              brand: validatedData.brand,
              model: validatedData.model,
              category: validatedData.category,
              condition: validatedData.condition,
              quantity: validatedData.quantity,
              price: validatedData.price,
              cost: validatedData.cost,
              description: validatedData.description,
              color: validatedData.color,
              size: validatedData.size,
              weight: validatedData.weight,
              currency: 'USD',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
          
          // Handle images from CPI format
          if (productData.imageUrls && productData.imageUrls.length > 0 && createdProduct.id) {
            console.log(`Processing ${productData.imageUrls.length} images for ${validatedData.title}`)
            
            let imageCount = 0
            for (let imgIndex = 0; imgIndex < productData.imageUrls.length && imgIndex < 10; imgIndex++) {
              const imageUrl = productData.imageUrls[imgIndex]
              
              try {
                // Validate image URL format
                if (!imageUrl.startsWith('http')) {
                  console.log(`Skipping invalid image URL: ${imageUrl}`)
                  continue
                }
                
                // Create image record
                await prisma.productImage.create({
                  data: {
                    productId: createdProduct.id,
                    originalUrl: imageUrl,
                    imageNumber: imageCount + 1,
                    uploadStatus: 'completed'
                  }
                })
                
                imageCount++
                console.log(`Added image ${imageCount} for ${validatedData.title}: ${imageUrl.substring(0, 50)}...`)
                
              } catch (imageError) {
                console.log(`Failed to add image ${imgIndex + 1} for ${validatedData.title}:`, imageError)
                // Continue with other images
              }
            }
            
            console.log(`Successfully added ${imageCount} images for ${validatedData.title}`)
          }
          
          // Try to fetch additional images if we have a UPC but no images from CPI
          if (validatedData.upc && createdProduct.id && (!productData.imageUrls || productData.imageUrls.length === 0)) {
            try {
              console.log(`Attempting to fetch images for UPC: ${validatedData.upc}`)
              const baseUrl = getApiBaseUrl(request)
              const imageResponse = await fetch(`${baseUrl}/api/vision/fetch-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  upc: validatedData.upc,
                  productTitle: validatedData.title,
                  productId: createdProduct.id
                })
              })
              
              if (imageResponse.ok) {
                const imageResult = await imageResponse.json()
                console.log(`Successfully fetched ${imageResult.imagesAdded || 0} additional images for ${validatedData.title}`)
              } else {
                console.log(`Failed to fetch additional images for ${validatedData.title}: ${imageResponse.statusText}`)
              }
            } catch (imageError) {
              console.log(`Error fetching additional images for ${validatedData.title}:`, imageError)
              // Don't fail the import if image fetching fails
            }
          }
          
          result.created++
        }
        
        result.processed++
        
      } catch (error) {
        console.error(`❌ Error processing row ${rowNumber}:`, error)
        console.error(`Row data (first 10 fields): [${row.slice(0, 10).map(r => `"${r?.substring(0, 30)}${r?.length > 30 ? '...' : ''}"`).join(', ')}]`)
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        result.errors.push({
          row: rowNumber,
          error: `${errorMessage}${row.length !== headers.length ? ` (Column mismatch: ${row.length}/${headers.length})` : ''}`,
          data: row.slice(0, 5) // Only include first 5 fields to avoid huge error objects
        })
        
        // Continue processing other rows even if one fails
        continue
      }
    }
    
    // Determine overall success
    result.success = result.errors.length < result.totalRows / 2 // Success if less than 50% errors
    
    return NextResponse.json({
      success: result.success,
      message: `Import completed: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors${skippedEmptyRows > 0 ? `, ${skippedEmptyRows} empty rows skipped` : ''}`,
      result: {
        ...result,
        skippedEmptyRows
      }
    })
    
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process bulk import',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}