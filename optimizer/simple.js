// Simple in-and-out eBay listing optimizer
const { CLI } = require('./dist/index.js');

/**
 * Simple function that takes an eBay URL and returns the optimized HTML
 * @param {string} url - eBay listing URL
 * @returns {Promise<{html: string, summary: string}>} - Optimized HTML and summary
 */
async function optimizeEbayListing(url) {
  const cli = new CLI();
  
  try {
    // Process the listing
    const result = await cli.pipeline.process(url, 'template.html');
    
    // Return the essential outputs
    return {
      html: result.renderedHtml,
      summary: generateSimpleSummary(result),
      product: {
        title: result.originalDetails.title,
        price: result.originalDetails.price,
        suggestedPrice: result.optimizedContent.suggestedPrice,
        keywords: result.optimizedContent.keywords
      }
    };
  } catch (error) {
    throw new Error(`Failed to optimize listing: ${error.message}`);
  }
}

/**
 * Generate a simple summary of the optimization results
 * @param {object} result - Pipeline result
 * @returns {string} - Summary text
 */
function generateSimpleSummary(result) {
  const { originalDetails, optimizedContent } = result;
  
  return `Optimization Summary:
Original: ${originalDetails.title}
Price: $${originalDetails.price} → $${optimizedContent.suggestedPrice}
Keywords: ${optimizedContent.keywords.join(', ')}`;
}

// Export the main function
module.exports = { optimizeEbayListing };

// Example usage:
if (require.main === module) {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node simple.js <ebay-url>');
    process.exit(1);
  }
  
  optimizeEbayListing(url)
    .then(result => {
      console.log('=== OPTIMIZATION COMPLETE ===');
      console.log('\nProduct Info:');
      console.log(`Title: ${result.product.title}`);
      console.log(`Original Price: $${result.product.price}`);
      console.log(`Suggested Price: $${result.product.suggestedPrice}`);
      console.log(`Keywords: ${result.product.keywords.join(', ')}`);
      
      console.log('\nSummary:');
      console.log(result.summary);
      
      console.log('\nHTML Template saved to: optimized-listing.html');
      console.log('Summary saved to: optimized-listing-summary.txt');
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
