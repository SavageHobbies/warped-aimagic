import { ProductDetails } from '../models';
export declare class ProductExtractor {
    extractProductDetails(content: {
        html: string;
    }): Promise<ProductDetails>;
    private extractTitle;
    private extractDescription;
    private extractAdditionalDescription;
    private extractPrice;
    private extractCondition;
    private isValidCondition;
    private extractImages;
    private extractMainImage;
    private extractUPCFromContent;
    private isValidImageUrl;
    private convertToHighResolution;
    private determineImageSize;
    private extractSpecifications;
    private extractSeller;
    private extractLocation;
    private isValidLocation;
    private attemptFallbackExtraction;
    private extractFallbackTitle;
    private extractFallbackDescription;
    private extractFallbackPrice;
    private extractFallbackCondition;
}
//# sourceMappingURL=ProductExtractor.d.ts.map