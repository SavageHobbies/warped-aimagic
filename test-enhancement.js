const { productDataService } = require('./src/lib/productDataService.ts')

async function testEnhancement() {
  console.log('🧪 Testing Comprehensive Product Enhancement...')
  
  // Test UPCs for different scenarios
  const testUPCs = [
    '889698572705', // Funko Pop format
    '123456789012', // Generic UPC
    '888888888888', // Another test UPC
    'NO_UPC'        // No UPC case
  ]
  
  for (const upc of testUPCs) {
    console.log(`\n📦 Testing UPC: ${upc}`)
    
    try {
      const data = await productDataService.fetchProductData(upc)
      
      if (data) {
        console.log('✅ Data found:', {
          title: data.title,
          brand: data.brand,
          source: data.source,
          fields: Object.keys(data).length
        })
      } else {
        console.log('ℹ️ No data found')
      }
    } catch (error) {
      console.error('❌ Error:', error.message)
    }
  }
  
  console.log('\n📊 Data Source Status:')
  const sources = productDataService.getDataSourceStatus()
  sources.forEach(source => {
    console.log(`  ${source.configured ? '✅' : '❌'} ${source.name} (Priority: ${source.priority})`)
  })
}

// Export for use in other scripts
module.exports = { testEnhancement }

// Run if called directly
if (require.main === module) {
  testEnhancement().catch(console.error)
}