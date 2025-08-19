// UPC-based market research and template generator
const { MarketResearcher } = require('./dist/services');
const { TemplateRenderer } = require('./dist/services');
const { logger } = require('./dist/utils');

/**
 * Takes a UPC and performs market research, then generates a template
 * @param {string} upc - Universal Product Code
 * @param {object} productInfo - Product information (title, description, price, etc.)
 * @returns {Promise<{html: string, summary: string, marketData: any}>} - Optimized HTML and market research
 */
async function optimizeByUPC(upc, productInfo = {}) {
  try {
    logger.info(`Starting UPC optimization for: ${upc}`);
    
    // Step 1: Perform market research using the UPC
    const marketResearcher = new MarketResearcher();
    const marketData = await marketResearcher.conductResearchByUPC(upc);
    
    // Step 2: Combine market data with provided product info
    const combinedProductInfo = {
      upc,
      title: productInfo.title || marketData.suggestedTitle || `Product ${upc}`,
      description: productInfo.description || marketData.suggestedDescription || '',
      price: productInfo.price || marketData.averagePrice || 0,
      condition: productInfo.condition || 'New',
      images: productInfo.images || [],
      specifications: productInfo.specifications || {},
      seller: productInfo.seller || 'Unknown Seller',
      location: productInfo.location || 'Unknown',
      ...marketData // Add all market research data
    };
    
    // Step 3: Create optimized content based on market research
    const optimizedContent = {
      optimizedTitle: marketData.optimizedTitle || combinedProductInfo.title,
      optimizedDescription: marketData.optimizedDescription || combinedProductInfo.description,
      suggestedPrice: marketData.suggestedPrice || combinedProductInfo.price,
      keywords: marketData.keywords || [],
      sellingPoints: marketData.sellingPoints || []
    };
    
    // Step 4: Generate HTML template
    const templateRenderer = new TemplateRenderer();
    const html = await templateRenderer.renderTemplate(optimizedContent, combinedProductInfo, 'template.html');
    
    // Step 5: Generate summary
    const summary = generateUPCSummary(combinedProductInfo, optimizedContent, marketData);
    
    return {
      html,
      summary,
      marketData,
      product: optimizedContent
    };
    
  } catch (error) {
    logger.error(`UPC optimization failed for ${upc}`, error);
    throw new Error(`UPC optimization failed: ${error.message}`);
  }
}

/**
 * Generate summary for UPC-based optimization
 * @param {object} productInfo - Product information
 * @param {object} optimizedContent - Optimized content
 * @param {object} marketData - Market research data
 * @returns {string} - Summary text
 */
function generateUPCSummary(productInfo, optimizedContent, marketData) {
  return `UPC Optimization Summary:
Product: ${productInfo.title}
UPC: ${productInfo.upc}
Original Price: $${productInfo.price}
Suggested Price: $${optimizedContent.suggestedPrice}
Market Average: $${marketData.averagePrice || 'N/A'}
Similar Listings: ${marketData.similarListings?.length || 0} found
Keywords: ${optimizedContent.keywords.join(', ')}

Market Research:
- Price Range: $${marketData.priceRange?.min || 'N/A'} - $${marketData.priceRange?.max || 'N/A'}
- Market Confidence: ${Math.round((marketData.confidence || 0) * 100)}%
- Trend: ${marketData.trend || 'stable'}`;
}

/**
 * Quick function to get market research by UPC
 * @param {string} upc - Universal Product Code
 * @returns {Promise<any>} - Market research data
 */
async function getMarketResearchByUPC(upc) {
  const marketResearcher = new MarketResearcher();
  return await marketResearcher.conductResearchByUPC(upc);
}

// Export the main functions
module.exports = { 
  optimizeByUPC, 
  getMarketResearchByUPC 
};

// Example usage:
if (require.main === module) {
  const upc = process.argv[2];
  const productInfo = process.argv[3] ? JSON.parse(process.argv[3]) : {};
  
  if (!upc) {
    console.error('Usage: node upc-optimizer.js <upc> [\'{"title":"Product Name","price":29.99}\']');
    process.exit(1);
  }
  
  console.log(`Optimizing product with UPC: ${upc}`);
  
  optimizeByUPC(upc, productInfo)
    .then(result => {
      console.log('=== UPC OPTIMIZATION COMPLETE ===');
      console.log('\nProduct Info:');
      console.log(`Title: ${result.product.optimizedTitle}`);
      console.log(`UPC: ${upc}`);
      console.log(`Suggested Price: $${result.product.suggestedPrice}`);
      console.log(`Keywords: ${result.product.keywords.join(', ')}`);
      
      console.log('\nMarket Research Summary:');
      console.log(result.summary);
      
      console.log('\nHTML Template saved to: optimized-listing.html');
      console.log('Market research data available for integration');
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
