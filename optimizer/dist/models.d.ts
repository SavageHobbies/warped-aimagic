export interface ProductDetails {
    title: string;
    description: string;
    price: number;
    condition: string;
    images: ImageData[];
    specifications: Record<string, string>;
    seller: string;
    location: string;
}
export interface ImageData {
    url: string;
    altText?: string;
    size: 'thumbnail' | 'medium' | 'large';
    isValid: boolean;
}
export interface OptimizedContent {
    optimizedTitle: string;
    optimizedDescription: string;
    suggestedPrice: number;
    keywords: string[];
    sellingPoints: string[];
}
export interface ResearchData {
    similarListings: SimilarListing[];
    priceAnalysis: PriceAnalysis;
    keywordAnalysis: KeywordAnalysis;
    marketTrends: MarketTrend[];
}
export interface SimilarListing {
    title: string;
    price: number;
    condition: string;
    platform: string;
    soldDate?: Date;
}
export interface PriceAnalysis {
    averagePrice: number;
    priceRange: {
        min: number;
        max: number;
    };
    recommendedPrice: number;
    confidence: number;
}
export interface KeywordAnalysis {
    popularKeywords: string[];
    keywordFrequency: Record<string, number>;
    searchVolume: Record<string, number>;
}
export interface MarketTrend {
    period: string;
    averagePrice: number;
    salesVolume: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}
export interface WebpageContent {
    html: string;
    title: string;
    metadata: Record<string, string>;
    timestamp: Date;
}
//# sourceMappingURL=models.d.ts.map