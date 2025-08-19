// Example usage of the Simple eBay Listing Optimizer

const { CLI } = require('./dist/index.js');

async function main() {
  const cli = new CLI();
  
  // Example eBay URL (replace with a real eBay listing URL)
  const ebayUrl = 'https://www.ebay.com/itm/EXAMPLE-LISTING-ID';
  
  try {
    console.log('Starting eBay listing optimization...');
    await cli.optimize(ebayUrl);
    console.log('Optimization completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main();
