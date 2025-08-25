const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addTestProducts() {
  console.log('🧪 Adding test products to verify inventory functionality...')
  
  try {
    // Create some test products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          upc: '889698572705',
          title: 'Funko Pop Wonder Woman',
          brand: 'Funko',
          condition: 'New',
          quantity: 5,
          price: 12.99,
          lowestRecordedPrice: 10.99,
          highestRecordedPrice: 15.99,
          enhancementStatus: 'not_enhanced',
          description: 'Wonder Woman Funko Pop figure in excellent condition.'
        }
      }),
      
      prisma.product.create({
        data: {
          upc: '889698540056',
          title: 'Funko POP TV Seinfeld Kramer',
          brand: 'Funko',
          condition: 'New',
          quantity: 8,
          price: 14.99,
          lowestRecordedPrice: 12.99,
          highestRecordedPrice: 16.99,
          enhancementStatus: 'enhanced',
          lastEnhanced: new Date(),
          description: 'Enhanced Kramer Funko Pop from Seinfeld TV series with AI-optimized title and description.'
        }
      }),
      
      prisma.product.create({
        data: {
          upc: '123456789012',
          title: 'Test Product for Editing',
          brand: 'Test Brand',
          condition: 'Used',
          quantity: 3,
          price: 9.99,
          enhancementStatus: 'not_enhanced',
          description: 'Test product to verify inline editing functionality.'
        }
      })
    ])
    
    console.log(`✅ Successfully created ${products.length} test products:`)
    products.forEach(p => {
      console.log(`  - ${p.title} (${p.upc}) - Qty: ${p.quantity}, Status: ${p.enhancementStatus}`)
    })
    
    // Verify we can fetch them
    const allProducts = await prisma.product.findMany()
    console.log(`\n📊 Total products in database: ${allProducts.length}`)
    
  } catch (error) {
    console.error('❌ Error creating test products:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestProducts()