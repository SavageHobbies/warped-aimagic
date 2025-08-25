"use strict";
/**
 * Comprehensive Product Data Service
 * Fetches product data from multiple external sources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.productDataService = void 0;
class ProductDataService {
    constructor() {
        this.dataSources = [];
        this.initializeDataSources();
    }
    initializeDataSources() {
        // Initialize data sources in priority order
        this.dataSources = [
            {
                name: 'UPCItemDB',
                priority: 1,
                fetchData: this.fetchFromUPCItemDB.bind(this)
            },
            {
                name: 'UPCDatabase',
                priority: 2,
                fetchData: this.fetchFromUPCDatabase.bind(this)
            },
            {
                name: 'AmazonSP-API',
                priority: 3,
                fetchData: this.fetchFromAmazonAPI.bind(this)
            },
            {
                name: 'eBayAPI',
                priority: 4,
                fetchData: this.fetchFromEbayAPI.bind(this)
            }
        ];
    }
    /**
     * Fetch comprehensive product data from multiple sources
     */
    async fetchProductData(upc) {
        if (!upc || upc === 'NO_UPC') {
            return null;
        }
        console.log(`🔍 Fetching comprehensive product data for UPC: ${upc}`);
        // Try each data source in priority order
        for (const source of this.dataSources) {
            try {
                console.log(`📡 Trying ${source.name}...`);
                const data = await source.fetchData(upc);
                if (data) {
                    console.log(`✅ Found data from ${source.name}:`, Object.keys(data));
                    data.source = source.name;
                    return data;
                }
            }
            catch (error) {
                console.log(`❌ ${source.name} failed:`, error);
                continue;
            }
        }
        console.log(`ℹ️ No external data found for UPC: ${upc}`);
        return null;
    }
    /**
     * Fetch from UPCItemDB API
     */
    async fetchFromUPCItemDB(upc) {
        const apiKey = process.env.UPCITEMDB_API_KEY;
        if (!apiKey) {
            console.log('ℹ️ UPCItemDB API key not configured');
            return null;
        }
        try {
            const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'InventoryScanner/1.0'
                },
                timeout: 10000
            });
            if (!response.ok) {
                throw new Error(`UPCItemDB API error: ${response.status}`);
            }
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                return {
                    title: item.title,
                    brand: item.brand,
                    description: item.description,
                    model: item.model,
                    color: item.color,
                    size: item.size,
                    weight: item.weight ? parseFloat(item.weight) : undefined,
                    weightUnit: item.weight_unit || 'g',
                    category: item.category,
                    images: item.images || [],
                    specifications: {
                        UPC: upc,
                        ASIN: item.asin,
                        EAN: item.ean,
                        MPN: item.mpn
                    }
                };
            }
        }
        catch (error) {
            console.error('UPCItemDB fetch error:', error);
        }
        return null;
    }
    /**
     * Fetch from UPCDatabase.org API (alternative UPC lookup service)
     */
    async fetchFromUPCDatabase(upc) {
        const apiKey = process.env.UPC_DATABASE_API_KEY;
        const apiUrl = process.env.UPC_DATABASE_API_URL;
        if (!apiKey || !apiUrl) {
            console.log('ℹ️ UPCDatabase API credentials not configured');
            return null;
        }
        try {
            const response = await fetch(`${apiUrl}/${upc}?key=${apiKey}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'InventoryScanner/1.0'
                },
                timeout: 15000
            });
            if (!response.ok) {
                throw new Error(`UPCDatabase API error: ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.product) {
                const product = data.product;
                return {
                    title: product.title || product.name,
                    brand: product.brand || product.manufacturer,
                    description: product.description,
                    model: product.model,
                    color: product.color,
                    size: product.size,
                    weight: product.weight ? parseFloat(product.weight) : undefined,
                    weightUnit: product.weight_unit || 'g',
                    category: product.category,
                    images: product.images || [],
                    specifications: {
                        UPC: upc,
                        Brand: product.brand,
                        Model: product.model,
                        Category: product.category,
                        ...product.specifications
                    }
                };
            }
        }
        catch (error) {
            console.error('UPCDatabase fetch error:', error);
        }
        return null;
    }
    /**
     * Fetch from Amazon SP-API (real Amazon product data)
     */
    async fetchFromAmazonAPI(upc) {
        const clientId = process.env.AMAZON_CLIENT_ID;
        const clientSecret = process.env.AMAZON_CLIENT_SECRET;
        const refreshToken = process.env.AMAZON_REFRESH_TOKEN;
        const region = process.env.AMAZON_REGION || 'us-east-1';
        if (!clientId || !clientSecret || !refreshToken) {
            console.log('ℹ️ Amazon SP-API credentials not configured');
            return null;
        }
        try {
            // First, get access token
            const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId,
                    client_secret: clientSecret
                })
            });
            if (!tokenResponse.ok) {
                throw new Error(`Amazon token error: ${tokenResponse.status}`);
            }
            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;
            // Search for product by UPC using Catalog Items API
            const catalogResponse = await fetch(`https://sellingpartnerapi-na.amazon.com/catalog/2022-04-01/items?identifiers=${upc}&identifiersType=UPC&marketplaceIds=ATVPDKIKX0DER`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'x-amz-access-token': accessToken,
                    'Accept': 'application/json'
                },
                timeout: 20000
            });
            if (!catalogResponse.ok) {
                throw new Error(`Amazon Catalog API error: ${catalogResponse.status}`);
            }
            const catalogData = await catalogResponse.json();
            if (catalogData.items && catalogData.items.length > 0) {
                const item = catalogData.items[0];
                const attributes = item.attributes || {};
                return {
                    title: attributes.item_name?.[0]?.value || item.asin,
                    brand: attributes.brand?.[0]?.value,
                    description: attributes.bullet_point?.map(bp => bp.value).join(' '),
                    model: attributes.model_number?.[0]?.value,
                    color: attributes.color?.[0]?.value,
                    size: attributes.size?.[0]?.value,
                    weight: attributes.item_weight?.[0]?.value ? parseFloat(attributes.item_weight[0].value) : undefined,
                    weightUnit: attributes.item_weight?.[0]?.unit,
                    dimensions: {
                        length: attributes.item_length?.[0]?.value,
                        width: attributes.item_width?.[0]?.value,
                        height: attributes.item_height?.[0]?.value,
                        unit: attributes.item_dimensions_unit?.[0]?.value
                    },
                    material: attributes.material_type?.[0]?.value,
                    category: item.productTypes?.[0]?.displayName,
                    images: item.images?.map(img => img.link).filter(Boolean) || [],
                    specifications: {
                        ASIN: item.asin,
                        UPC: upc,
                        Brand: attributes.brand?.[0]?.value,
                        Model: attributes.model_number?.[0]?.value,
                        ...Object.fromEntries(Object.entries(attributes).map(([key, values]) => [
                            key,
                            Array.isArray(values) ? values[0]?.value : values
                        ]))
                    }
                };
            }
        }
        catch (error) {
            console.error('Amazon SP-API fetch error:', error);
        }
        return null;
    }
    /**
     * Determine product category and generate appropriate data
     */
    determineProductCategory(upc) {
        // Funko Pops and Collectibles (889698, 889671)
        if (upc.startsWith('88969') || upc.startsWith('88967')) {
            const characters = ['Batman', 'Wonder Woman', 'Superman', 'Spider-Man', 'Iron Man', 'Hulk', 'Thor', 'Captain America', 'Darth Vader', 'Luke Skywalker', 'Harry Potter', 'Hermione', 'Pikachu', 'Charizard'];
            const franchises = ['DC Comics', 'Marvel', 'Disney', 'Star Wars', 'Harry Potter', 'Pokemon', 'Anime', 'Gaming'];
            const character = characters[Math.floor(Math.random() * characters.length)];
            const franchise = franchises[Math.floor(Math.random() * franchises.length)];
            return {
                title: `Funko Pop ${franchise} ${character}`,
                brand: 'Funko',
                description: `Official Funko Pop vinyl figure from the ${franchise} series featuring ${character}. This collectible figure stands approximately 3.75 inches tall and comes in a window display box.`,
                category: 'Collectibles',
                subcategory: 'Action Figures',
                basePrice: 8.99,
                priceRange: 15,
                weight: 0.15,
                dimensions: { length: 6.5, width: 6.5, height: 9.5, unit: 'cm' },
                material: 'Vinyl',
                specifications: {
                    'Product Line': 'Pop!',
                    'Character': character,
                    'Franchise': franchise,
                    'Height': '3.75 inches',
                    'Figure Type': 'Vinyl'
                },
                categorySpecificFields: {
                    character,
                    franchise,
                    series: franchise,
                    theme: franchise,
                    funkoPop: true,
                    ageRecommendation: '3+',
                    exclusivity: Math.random() > 0.7 ? 'Exclusive' : undefined
                }
            };
        }
        // Clothing (starts with 0, 1, 2, 3)
        if (/^[0-3]/.test(upc)) {
            const brands = ['Nike', 'Adidas', 'Under Armour', 'Levi\'s', 'Gap', 'H&M', 'Zara', 'Uniqlo'];
            const clothingTypes = ['T-Shirt', 'Jeans', 'Dress', 'Jacket', 'Sweater', 'Pants', 'Shorts', 'Shirt'];
            const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
            const colors = ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Pink'];
            const materials = ['Cotton', 'Polyester', 'Cotton Blend', 'Denim', 'Wool', 'Linen'];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const type = clothingTypes[Math.floor(Math.random() * clothingTypes.length)];
            const size = sizes[Math.floor(Math.random() * sizes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const material = materials[Math.floor(Math.random() * materials.length)];
            return {
                title: `${brand} ${color} ${type} - Size ${size}`,
                brand,
                description: `Comfortable and stylish ${type.toLowerCase()} from ${brand}. Made with high-quality ${material.toLowerCase()} for durability and comfort. Perfect for casual wear.`,
                category: 'Clothing',
                subcategory: type,
                basePrice: 15.99,
                priceRange: 40,
                weight: 0.3,
                dimensions: { length: 30, width: 25, height: 2, unit: 'cm' },
                material,
                specifications: {
                    'Size': size,
                    'Color': color,
                    'Care Instructions': 'Machine wash cold',
                    'Fabric Content': material,
                    'Origin': 'Imported'
                },
                categorySpecificFields: {
                    size,
                    color,
                    ageGroup: 'Adult',
                    gender: 'Unisex',
                    fit: 'Regular',
                    careInstructions: 'Machine wash cold, tumble dry low',
                    fabricType: material
                }
            };
        }
        // Electronics (starts with 8, 9)
        if (/^[89]/.test(upc)) {
            const brands = ['Sony', 'Samsung', 'Apple', 'LG', 'Panasonic', 'Canon', 'Nikon', 'Bose'];
            const types = ['Headphones', 'Speaker', 'Camera', 'TV', 'Monitor', 'Phone Case', 'Charger', 'Cable'];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            return {
                title: `${brand} ${type} - Professional Quality`,
                brand,
                description: `High-quality ${type.toLowerCase()} from ${brand}. Features advanced technology and premium build quality for professional and personal use.`,
                category: 'Electronics',
                subcategory: type,
                basePrice: 49.99,
                priceRange: 200,
                weight: 0.8,
                dimensions: { length: 15, width: 10, height: 5, unit: 'cm' },
                material: 'Plastic/Metal',
                specifications: {
                    'Model': `${brand}-${type}-${Math.floor(Math.random() * 1000)}`,
                    'Power Source': 'Battery/AC',
                    'Warranty': '1 Year',
                    'Connectivity': 'Bluetooth/Wired'
                },
                categorySpecificFields: {
                    powerSource: 'Battery/AC Adapter',
                    warranty: '1 Year Limited Warranty',
                    connectivity: 'Bluetooth 5.0, USB-C',
                    compatibility: 'Universal'
                }
            };
        }
        // Home & Garden / Furniture (starts with 4, 5, 6)
        if (/^[456]/.test(upc)) {
            const brands = ['IKEA', 'Ashley', 'Wayfair', 'West Elm', 'CB2', 'Target', 'HomeGoods'];
            const types = ['Chair', 'Table', 'Lamp', 'Cushion', 'Rug', 'Shelf', 'Mirror', 'Vase'];
            const materials = ['Wood', 'Metal', 'Fabric', 'Glass', 'Ceramic', 'Plastic', 'Leather'];
            const rooms = ['Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Bathroom'];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const material = materials[Math.floor(Math.random() * materials.length)];
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            return {
                title: `${brand} ${material} ${type} - ${room}`,
                brand,
                description: `Stylish and functional ${type.toLowerCase()} made from high-quality ${material.toLowerCase()}. Perfect for ${room.toLowerCase()} use with modern design that complements any decor.`,
                category: 'Home & Garden',
                subcategory: type,
                basePrice: 25.99,
                priceRange: 150,
                weight: 5.2,
                dimensions: { length: 60, width: 40, height: 80, unit: 'cm' },
                material,
                specifications: {
                    'Room Type': room,
                    'Assembly Required': 'Yes',
                    'Care Instructions': 'Wipe clean with damp cloth',
                    'Style': 'Modern'
                },
                categorySpecificFields: {
                    roomType: room,
                    assemblyRequired: true,
                    careInstructions: 'Wipe clean with damp cloth',
                    style: 'Modern',
                    finish: 'Natural'
                }
            };
        }
        // Books (starts with 978, 979)
        if (upc.startsWith('978') || upc.startsWith('979')) {
            const authors = ['Stephen King', 'J.K. Rowling', 'Agatha Christie', 'Dan Brown', 'John Grisham'];
            const genres = ['Fiction', 'Mystery', 'Romance', 'Science Fiction', 'Biography', 'Self-Help'];
            const publishers = ['Penguin', 'Random House', 'HarperCollins', 'Simon & Schuster', 'Macmillan'];
            const author = authors[Math.floor(Math.random() * authors.length)];
            const genre = genres[Math.floor(Math.random() * genres.length)];
            const publisher = publishers[Math.floor(Math.random() * publishers.length)];
            return {
                title: `${genre} Novel by ${author}`,
                brand: publisher,
                description: `Captivating ${genre.toLowerCase()} novel by bestselling author ${author}. Published by ${publisher} with engaging storytelling and compelling characters.`,
                category: 'Books',
                subcategory: genre,
                basePrice: 9.99,
                priceRange: 15,
                weight: 0.4,
                dimensions: { length: 20, width: 13, height: 2, unit: 'cm' },
                material: 'Paper',
                specifications: {
                    'Author': author,
                    'Publisher': publisher,
                    'Format': 'Paperback',
                    'Language': 'English',
                    'Pages': `${200 + Math.floor(Math.random() * 300)}`
                },
                categorySpecificFields: {
                    author,
                    publisher,
                    genre,
                    language: 'English',
                    format: 'Paperback'
                }
            };
        }
        // Default for any other UPC
        const generalCategories = ['General Merchandise', 'Tools', 'Sports', 'Beauty', 'Automotive'];
        const generalBrands = ['Generic', 'OEM', 'Universal', 'Standard', 'Premium'];
        const category = generalCategories[Math.floor(Math.random() * generalCategories.length)];
        const brand = generalBrands[Math.floor(Math.random() * generalBrands.length)];
        return {
            title: `${brand} ${category} Product`,
            brand,
            description: `Quality ${category.toLowerCase()} product from ${brand}. Reliable and durable construction with modern design.`,
            category,
            subcategory: 'General',
            basePrice: 19.99,
            priceRange: 50,
            weight: 1.0,
            dimensions: { length: 20, width: 15, height: 10, unit: 'cm' },
            material: 'Mixed Materials',
            specifications: {
                'Type': category,
                'Quality': 'Standard',
                'Origin': 'Various'
            },
            categorySpecificFields: {}
        };
    }
    /**
     * Fetch from eBay API (real eBay product and pricing data)
     */
    async fetchFromEbayAPI(upc) {
        const appId = process.env.EBAY_APP_ID;
        const environment = process.env.EBAY_ENVIRONMENT || 'production';
        if (!appId) {
            console.log('ℹ️ eBay API credentials not configured');
            return null;
        }
        const baseUrl = environment === 'production'
            ? 'https://api.ebay.com'
            : 'https://api.sandbox.ebay.com';
        try {
            // Search for active listings by UPC
            const searchResponse = await fetch(`${baseUrl}/buy/browse/v1/item_summary/search?q=${upc}&limit=10&filter=itemLocationCountry:US`, {
                headers: {
                    'Authorization': `Bearer ${await this.getEbayAccessToken()}`,
                    'Accept': 'application/json',
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                },
                timeout: 15000
            });
            if (!searchResponse.ok) {
                throw new Error(`eBay Search API error: ${searchResponse.status}`);
            }
            const searchData = await searchResponse.json();
            if (searchData.itemSummaries && searchData.itemSummaries.length > 0) {
                const item = searchData.itemSummaries[0];
                // Get detailed item information
                const itemId = item.itemId;
                const detailResponse = await fetch(`${baseUrl}/buy/browse/v1/item/${itemId}`, {
                    headers: {
                        'Authorization': `Bearer ${await this.getEbayAccessToken()}`,
                        'Accept': 'application/json',
                        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                    }
                });
                let detailedItem = item;
                if (detailResponse.ok) {
                    detailedItem = await detailResponse.json();
                }
                return {
                    title: detailedItem.title,
                    brand: detailedItem.brand,
                    description: detailedItem.shortDescription || detailedItem.description,
                    color: detailedItem.color,
                    size: detailedItem.size,
                    price: detailedItem.price?.value ? parseFloat(detailedItem.price.value) : undefined,
                    category: detailedItem.categoryPath,
                    images: detailedItem.image?.imageUrl ? [detailedItem.image.imageUrl] : [],
                    specifications: {
                        'Item ID': itemId,
                        'UPC': upc,
                        'Condition': detailedItem.condition,
                        'Shipping': detailedItem.shippingOptions?.[0]?.shippingCost?.value || 'Free',
                        'Seller': detailedItem.seller?.username,
                        'Location': detailedItem.itemLocation?.city + ', ' + detailedItem.itemLocation?.stateOrProvince
                    },
                    additionalAttributes: {
                        ebayItemId: itemId,
                        ebayCategory: detailedItem.categoryId,
                        watchCount: detailedItem.watchCount,
                        viewCount: detailedItem.viewCount
                    }
                };
            }
        }
        catch (error) {
            console.error('eBay API fetch error:', error);
        }
        return null;
    }
    /**
     * Get eBay OAuth access token
     */
    async getEbayAccessToken() {
        const appId = process.env.EBAY_APP_ID;
        const certId = process.env.EBAY_CERT_ID;
        const environment = process.env.EBAY_ENVIRONMENT || 'production';
        const baseUrl = environment === 'production'
            ? 'https://api.ebay.com'
            : 'https://api.sandbox.ebay.com';
        const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');
        const response = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
        });
        const data = await response.json();
        return data.access_token;
    }
    /**
     * Merge external data with existing product data
     */
    mergeProductData(existingData, externalData) {
        // Only update fields that are empty or null in existing data
        const merged = { ...existingData };
        for (const [key, value] of Object.entries(externalData)) {
            if (value !== null && value !== undefined && (!merged[key] || merged[key] === '')) {
                merged[key] = value;
            }
        }
        return merged;
    }
    /**
     * Get data source status
     */
    getDataSourceStatus() {
        return this.dataSources.map(source => ({
            name: source.name,
            configured: this.isDataSourceConfigured(source.name),
            priority: source.priority
        }));
    }
    /**
     * Check if a data source is properly configured
     */
    isDataSourceConfigured(sourceName) {
        switch (sourceName) {
            case 'UPCItemDB':
                return !!process.env.UPCITEMDB_API_URL;
            case 'UPCDatabase':
                return !!(process.env.UPC_DATABASE_API_KEY && process.env.UPC_DATABASE_API_URL);
            case 'AmazonSP-API':
                return !!(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET && process.env.AMAZON_REFRESH_TOKEN);
            case 'eBayAPI':
                return !!(process.env.EBAY_APP_ID && process.env.EBAY_CERT_ID);
            default:
                return false;
        }
    }
}
// Export singleton instance
exports.productDataService = new ProductDataService();
