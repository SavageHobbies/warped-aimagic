import { ProductDetails, ResearchData } from '../models';
export declare class MarketResearcher {
    private readonly SIMILARITY_THRESHOLD;
    private readonly MAX_SIMILAR_LISTINGS;
    private readonly CONFIDENCE_THRESHOLD;
    conductResearch(productDetails: ProductDetails): Promise<ResearchData>;
    /**
     * Conduct market research using UPC instead of product details
     * @param upc - Universal Product Code
     * @returns Promise containing market research data
     */
    conductResearchByUPC(upc: string): Promise<any>;
    /**
     * Get product information from UPC (simulated)
     * @param upc - Universal Product Code
     * @returns Promise containing product information
     */
    private getProductInfoByUPC;
    /**
     * Generate optimized title based on market research
     * @param title - Original title
     *returns Optimized title
     */
    private generateOptimizedTitle;
    /**
     * Generate optimized description based on market research
     * @param description - Original description
     * @returns Optimized description
     */
    private generateOptimizedDescription;
    /**
     * Generate selling points based on product title
     * @param title - Product title
     * @returns Array of selling points
     */
    private generateSellingPoints;
    /**
     * Determine market trend from market trends data
     * @param marketTrends - Array of market trends
     * @returns Market trend direction
     */
    private determineMarketTrend;
    private findSimilarProducts;
    private analyzePricing;
    private analyzeKeywords;
    private analyzeMarketTrends;
    private extractKeyTerms;
    private generateSimilarTitle;
    private extractWords;
    private generateRecentDate;
    private delay;
}
//# sourceMappingURL=MarketResearcher.d.ts.map