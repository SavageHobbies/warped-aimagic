import { ProductDetails, OptimizedContent } from '../models';
export declare class TemplateRenderer {
    renderTemplate(optimizedContent: OptimizedContent, productDetails: ProductDetails, templatePath: string): Promise<string>;
    private generateHtmlTemplate;
    private generateImageGallery;
    private generateSpecificationsTable;
}
//# sourceMappingURL=TemplateRenderer.d.ts.map