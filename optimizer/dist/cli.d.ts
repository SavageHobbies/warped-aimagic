/**
 * Simple command line interface for the eBay Listing Optimizer
 */
export declare class CLI {
    private pipeline;
    constructor();
    /**
     * Main optimization command
     */
    optimize(url: string, templatePath?: string): Promise<void>;
    /**
     * Validate URL
     */
    private validateUrl;
    /**
     * Process the listing with progress indicators
     */
    private processWithProgress;
    /**
     * Show progress message
     */
    private showProgress;
    /**
     * Display processing results to the user
     */
    private displayResults;
    /**
     * Display extracted product details
     */
    private displayProductDetails;
    /**
     * Display optimized content
     */
    private displayOptimizedContent;
    /**
     * Display pricing analysis
     */
    private displayPricingAnalysis;
    /**
     * Save output to file
     */
    private saveOutput;
    /**
     * Generate a text summary of the optimization results
     */
    private generateSummary;
}
//# sourceMappingURL=cli.d.ts.map