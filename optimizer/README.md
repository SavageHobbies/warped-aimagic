# Simple eBay Listing Optimizer

A streamlined eBay listing optimizer that takes a URL and generates market research with optimized templates.

## Simple In & Out

The simplest way to use this program is with the `simple.js` file:

### Command Line Usage
```bash
node simple.js "https://www.ebay.com/itm/EXAMPLE-LISTING-ID"
```

### Programmatic Usage
```javascript
const { optimizeEbayListing } = require('./simple.js');

// Optimize an eBay listing
async function main() {
  const url = "https://www.ebay.com/itm/EXAMPLE-LISTING-ID";
  
  try {
    const result = await optimizeEbayListing(url);
    
    console.log('HTML Template:', result.html);
    console.log('Summary:', result.summary);
    console.log('Product Info:', result.product);
    
    // The HTML is also automatically saved to 'optimized-listing.html'
    // and the summary to 'optimized-listing-summary.txt'
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Features

- **Simple Input**: Just provide an eBay listing URL
- **Market Research**: Analyzes similar products and pricing
- **Content Optimization**: Generates optimized titles, descriptions, and keywords
- **Template Generation**: Creates professional HTML templates
- **Price Analysis**: Provides market-based pricing recommendations
- **File Output**: Automatically saves HTML template and summary report

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd simple-optimizer

# Install dependencies
npm install

# Build the project
npm run build
```

### Usage Examples

#### 1. Simple Command Line
```bash
node simple.js "https://www.ebay.com/itm/1234567890"
```

#### 2. Programmatic Integration
```javascript
const { optimizeEbayListing } = require('./simple.js');

// Use in your application
const result = await optimizeEbayListing(ebayUrl);
// result.html contains the optimized HTML template
// result.summary contains a text summary
// result.product contains key product information
```

#### 3. Using the CLI Class Directly
```javascript
const { CLI } = require('./dist/index.js');

const cli = new CLI();
await cli.optimize('https://www.ebay.com/itm/1234567890');
```

## How It Works

1. **Input**: eBay listing URL
2. **Web Scraping**: Extracts product details from the URL
3. **Market Research**: Analyzes similar products and pricing data
4. **Content Optimization**: Generates improved titles, descriptions, and keywords
5. **Template Rendering**: Creates a professional HTML template
6. **Output**: Returns HTML template and saves files to disk

## Output

The program generates:
- **HTML Template**: A complete, styled HTML template for the eBay listing
- **Summary File**: A text summary of the optimization results
- **Product Information**: Title, pricing, and keywords

## Project Structure

```
simple-optimizer/
├── src/
│   ├── cli.ts              # Command line interface
│   ├── index.ts            # Main entry point
│   ├── models.ts           # Data models
│   ├── pipeline.ts         # Main pipeline orchestrator
│   ├── services/           # Core services
│   │   ├── WebScraper.ts   # Web scraping service
│   │   ├── ProductExtractor.ts # Product extraction
│   │   ├── MarketResearcher.ts # Market analysis
│   │   ├── ContentOptimizer.ts # Content optimization
│   │   ├── TemplateRenderer.ts # HTML template generation
│   │   └── index.ts       # Service exports
│   └── utils.ts            # Utility functions
├── dist/                   # Compiled JavaScript
├── simple.js              # Simple in-and-out interface (RECOMMENDED)
├── example.js             # Detailed usage example
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Dependencies

- **axios**: For HTTP requests
- **cheerio**: For HTML parsing
- **typescript**: For type safety
- **ts-node**: For running TypeScript directly

## Development

```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Use the simple interface
node simple.js "https://www.ebay.com/itm/EXAMPLE-LISTING-ID"
```

## License

MIT
