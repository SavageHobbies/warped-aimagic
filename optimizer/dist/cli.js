"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = void 0;
// Simple CLI for eBay listing optimizer
const pipeline_1 = require("./pipeline");
const utils_1 = require("./utils");
/**
 * Simple command line interface for the eBay Listing Optimizer
 */
class CLI {
    constructor() {
        this.pipeline = new pipeline_1.Pipeline();
    }
    /**
     * Main optimization command
     */
    async optimize(url, templatePath = 'template.html') {
        try {
            console.log('\n🚀 eBay Listing Optimizer - Simple Version\n');
            // Validate URL (basic check)
            if (!this.validateUrl(url)) {
                console.error('❌ Invalid eBay URL');
                console.error('Please provide a valid eBay listing URL (e.g., https://www.ebay.com/itm/...)');
                return;
            }
            console.log('📝 Processing your eBay listing...');
            console.log(`🔗 URL: ${url}`);
            console.log(`📄 Template: ${templatePath}\n`);
            // Process the listing
            const result = await this.processWithProgress(url, templatePath);
            // Display results
            this.displayResults(result);
            // Save output
            await this.saveOutput(result, 'optimized-listing.html');
            console.log('\n✅ Optimization complete!');
        }
        catch (error) {
            utils_1.logger.error('CLI optimization failed', error);
            console.error('\n❌ Error during optimization:');
            console.error(error instanceof Error ? error.message : 'Unknown error');
            process.exit(1);
        }
    }
    /**
     * Validate URL
     */
    validateUrl(url) {
        return url.includes('ebay.com') && url.includes('itm/');
    }
    /**
     * Process the listing with progress indicators
     */
    async processWithProgress(url, templatePath) {
        const steps = [
            '🔍 Scraping eBay listing...',
            '📦 Extracting product details...',
            '📊 Conducting market research...',
            '✨ Optimizing content...',
            '🎨 Generating HTML template...'
        ];
        let currentStep = 0;
        // Show initial step
        this.showProgress(steps[currentStep++]);
        try {
            const result = await this.pipeline.process(url, templatePath);
            // Show completion for remaining steps
            while (currentStep < steps.length) {
                this.showProgress(steps[currentStep++]);
            }
            return result;
        }
        catch (error) {
            console.error(`\n❌ Failed at step: ${steps[currentStep - 1] || 'Unknown step'}`);
            throw error;
        }
    }
    /**
     * Show progress message
     */
    showProgress(message) {
        console.log(message);
    }
    /**
     * Display processing results to the user
     */
    displayResults(result) {
        console.log('\n📊 Processing Results\n');
        console.log('─'.repeat(50));
        // Display original product details
        this.displayProductDetails(result.originalDetails);
        // Display optimized content
        this.displayOptimizedContent(result.optimizedContent);
        // Display pricing analysis
        this.displayPricingAnalysis(result.originalDetails.price, result.optimizedContent.suggestedPrice, result.researchData);
        console.log('─'.repeat(50));
    }
    /**
     * Display extracted product details
     */
    displayProductDetails(details) {
        console.log('\n📦 Original Product Details:');
        console.log(`   Title: ${details.title}`);
        console.log(`   Price: $${details.price}`);
        console.log(`   Condition: ${details.condition}`);
        console.log(`   Images: ${details.images.length} found`);
        if (details.description) {
            const shortDesc = details.description.length > 100
                ? details.description.substring(0, 100) + '...'
                : details.description;
            console.log(`   Description: ${shortDesc}`);
        }
    }
    /**
     * Display optimized content
     */
    displayOptimizedContent(content) {
        console.log('\n✨ Optimized Content:');
        console.log(`   Title: ${content.optimizedTitle}`);
        console.log(`   Suggested Price: $${content.suggestedPrice}`);
        console.log(`   Keywords: ${content.keywords.join(', ')}`);
        console.log(`   Selling Points: ${content.sellingPoints.length} identified`);
    }
    /**
     * Display pricing analysis
     */
    displayPricingAnalysis(originalPrice, suggestedPrice, researchData) {
        console.log('\n💰 Pricing Analysis:');
        if (researchData && researchData.priceAnalysis) {
            const analysis = researchData.priceAnalysis;
            console.log(`   Original Price: $${originalPrice}`);
            console.log(`   Market Average: $${analysis.averagePrice}`);
            console.log(`   Price Range: $${analysis.priceRange.min} - $${analysis.priceRange.max}`);
            console.log(`   Recommended Price: $${suggestedPrice}`);
            console.log(`   Market Confidence: ${Math.round(analysis.confidence * 100)}%`);
            // Price positioning analysis
            const priceDiff = suggestedPrice - originalPrice;
            const percentChange = ((priceDiff / originalPrice) * 100).toFixed(1);
            if (priceDiff > 0) {
                console.log(`   💡 Opportunity: +$${priceDiff.toFixed(2)} (+${percentChange}%)`);
            }
            else if (priceDiff < 0) {
                console.log(`   ⚠️  Adjustment: $${priceDiff.toFixed(2)} (${percentChange}%)`);
            }
            else {
                console.log(`   ✅ Current pricing is optimal`);
            }
        }
    }
    /**
     * Save output to file
     */
    async saveOutput(result, outputPath) {
        try {
            const fs = require('fs').promises;
            await fs.writeFile(outputPath, result.renderedHtml, 'utf8');
            console.log(`\n💾 HTML template saved to: ${outputPath}`);
            // Also save a summary file
            const summaryPath = outputPath.replace('.html', '-summary.txt');
            const summary = this.generateSummary(result);
            await fs.writeFile(summaryPath, summary, 'utf8');
            console.log(`📋 Summary saved to: ${summaryPath}`);
        }
        catch (error) {
            console.error(`\n❌ Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate a text summary of the optimization results
     */
    generateSummary(result) {
        const { originalDetails, optimizedContent } = result;
        return `eBay Listing Optimization Summary
Generated: ${new Date().toLocaleString()}

ORIGINAL LISTING:
Title: ${originalDetails.title}
Price: $${originalDetails.price}
Condition: ${originalDetails.condition}
Images: ${originalDetails.images.length}

OPTIMIZED CONTENT:
Title: ${optimizedContent.optimizedTitle}
Suggested Price: $${optimizedContent.suggestedPrice}
Keywords: ${optimizedContent.keywords.join(', ')}
Selling Points: ${optimizedContent.sellingPoints.join(', ')}

OPTIMIZATION IMPROVEMENTS:
- Title optimization with SEO keywords
- Market-based pricing recommendation
- Enhanced product description
- Professional image gallery (${originalDetails.images.length} images)
- Competitive analysis insights

NEXT STEPS:
1. Review the generated HTML template
2. Copy the HTML content to your eBay listing
3. Adjust pricing based on your profit margins
4. Monitor listing performance and engagement
`;
    }
}
exports.CLI = CLI;
//# sourceMappingURL=cli.js.map