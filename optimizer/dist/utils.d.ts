import { ProductDetails } from './models';
export declare function isValidEbayUrl(url: string): boolean;
export declare function sanitizeUrl(url: string): string;
export declare function formatPrice(text: string): number;
export declare function validateProductDetails(details: ProductDetails): boolean;
export declare const logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: any) => void;
};
export declare function delay(ms: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map