# CPI (Comprehensive Product Information) Data Mapping

## Overview
This document defines the bidirectional mapping between CPI CSV columns and the Prisma database schema.

## Primary Key
- **UPC** is the REQUIRED primary identifier for all products
- Import will skip rows without a valid UPC
- Upsert operations use UPC as the unique identifier

## Database Tables Involved
1. **Product** - Core product information
2. **AIContent** - AI-generated descriptions and metadata
3. **ProductImage** - Product images
4. **Category** - Category classifications (eBay, Google, Product Type)
5. **ProductCategory** - Links products to categories
6. **Offer** - Pricing information
7. **InventoryItem** - Inventory tracking
8. **ListingDraft** - Draft listing information (read-only for export)

## CSV to Prisma Mapping

### Product Table Fields
| CSV Column | Prisma Field | Type | Notes |
|------------|--------------|------|-------|
| UPC | Product.upc | String | REQUIRED - Primary identifier |
| EAN | Product.ean | String? | Optional barcode |
| GTIN | Product.gtin | String? | Optional global trade number |
| SKU | Product.sku | String? | Unique stock keeping unit |
| Title | Product.title | String | Product name |
| Description | Product.description | String? | Main description |
| Brand | Product.brand | String? | Manufacturer brand |
| Model | Product.model | String? | Product model |
| Condition | Product.condition | String | Default: "New" |
| Quantity | Product.quantity | Int | Stock quantity |
| Stock | Product.quantity | Int | Alternative to Quantity (Stock takes precedence) |
| Currency | Product.currency | String | Default: "USD" |
| Color | Product.color | String? | Product color |
| Size | Product.size | String? | Product size |
| Material | Product.material | String? | Product material |
| Features | Product.features | String? | Comma-separated features/keywords |

### Weight & Dimensions
| CSV Column | Prisma Field | Conversion | Notes |
|------------|--------------|------------|-------|
| Weight (unit) | Product.weight | To grams | Supports: g, kg, lb, oz |
| Weight (unit) | Product.weightUnit | "g" | Always stored as grams |
| Length (unit) | Product.dimensions.length | To cm | Supports: cm, mm, in |
| Width (unit) | Product.dimensions.width | To cm | Supports: cm, mm, in |
| Height (unit) | Product.dimensions.height | To cm | Supports: cm, mm, in |
| Dimensions | Product.dimensions | JSON | Free text, parsed if possible |

### AIContent Table Fields
| CSV Column | Prisma Field | Type | Notes |
|------------|--------------|------|-------|
| Type | AIContent.category | String? | Product category/type |
| Short Description | AIContent.shortDescription | String? | Brief description |
| Long Description | AIContent.productDescription | String? | Detailed description |
| Unique Selling Points | AIContent.uniqueSellingPoints | String? | USPs |
| Key Features | AIContent.keyFeatures | String? | Feature list |
| Specifications | AIContent.specifications | String? | Technical specs |
| Item Specifics | AIContent.itemSpecifics | String? | eBay item specifics |
| Tags | AIContent.tags | String? | Search tags |
| Additional Attributes | AIContent.additionalAttributes | String? | JSON for unmapped fields |

### Pricing (Offer Table)
| CSV Column | Prisma Field | Type | Notes |
|------------|--------------|------|-------|
| Price | Offer.price | Float? | Current price |
| Regular Price | Offer.listPrice | Float? | Original/MSRP |
| Sale Price | Offer.price | Float? | Overrides Price if present |
| Currency | Offer.currency | String | From Product.currency |
| Lowest Recorded Price | Product.lowestRecordedPrice | Float? | Historical low |
| Highest Recorded Price | Product.highestRecordedPrice | Float? | Historical high |

**Note**: Offers are created with merchant="CPI_IMPORT" and availability="in stock"

### Categories
| CSV Column | Category Type | Prisma Fields | Notes |
|------------|---------------|---------------|-------|
| eBay Category Id | EBAY | Category.categoryId, Category.type="EBAY" | Links via ProductCategory |
| eBay Category | EBAY | Category.name | Category name/path |
| Google ID # | GOOGLE | Category.categoryId, Category.type="GOOGLE" | Links via ProductCategory |
| Google Category | GOOGLE | Category.name | Google category path |
| Product Type | PRODUCT_TYPE | Category.name, Category.type="PRODUCT_TYPE" | Custom type |

**Note**: eBay category is marked as isPrimary=true in ProductCategory when present

### Images
| CSV Column | Prisma Field | Type | Notes |
|------------|--------------|------|-------|
| Images | - | String | Comma-separated URLs (parsed) |
| Image 1 | ProductImage.originalUrl | String? | imageNumber=1 |
| Image 2 | ProductImage.originalUrl | String? | imageNumber=2 |
| Image 3 | ProductImage.originalUrl | String? | imageNumber=3 |
| Image 4 | ProductImage.originalUrl | String? | imageNumber=4 |
| Image 5 | ProductImage.originalUrl | String? | imageNumber=5 |
| Image 6 | ProductImage.originalUrl | String? | imageNumber=6 |
| Image 7 | ProductImage.originalUrl | String? | imageNumber=7 |
| Image 8 | ProductImage.originalUrl | String? | imageNumber=8 |
| Image 9 | ProductImage.originalUrl | String? | imageNumber=9 |
| Image 10 | ProductImage.originalUrl | String? | imageNumber=10 |
| Image 11 | ProductImage.originalUrl | String? | imageNumber=11 |
| Image 12 | ProductImage.originalUrl | String? | imageNumber=12 |

### Unmapped Fields (Stored in AIContent.additionalAttributes as JSON)
These fields are preserved for round-trip compatibility but not directly mapped:
- Pattern
- Style
- Occasion
- Suggested Use
- Ingredients
- Fitment & Compatibility
- Installation
- Care Instructions
- Key Benefits
- History & Provenance
- Condition Details
- Authentication
- Low stock amount
- Backorders allowed?
- Sold individually?
- Tax status
- Tax class
- ePID
- Shipping class
- Published
- Is featured?
- Visibility in catalog
- Allow customer reviews?
- Purchase Note
- Download limit
- Download expiry days
- Parent
- Grouped products
- Upsells
- Cross-sells
- External URL
- Button text
- Position
- Upload Status
- Date sale price starts
- Date sale price ends

## Prisma to CSV Export Mapping

### Export Rules
1. All 91 CPI columns must be present in exact order
2. Empty string for missing/null values
3. Text fields sanitized for CSV (quotes, commas, newlines)
4. Maintain round-trip capability for all mapped fields

### Field Export Priority
| CSV Column | Export Logic |
|------------|--------------|
| Title | Product.title → AIContent.ebayTitle → AIContent.seoTitle |
| Description | Product.description |
| Long Description | AIContent.productDescription |
| Price | Offer.price (CPI_IMPORT merchant preferred) |
| Regular Price | Offer.listPrice |
| Currency | Offer.currency → Product.currency |
| Dimensions | Format: "L x W x H cm" from Product.dimensions |
| Images | Comma-separated list from ProductImage (up to 12) |
| Image 1-12 | ProductImage.originalUrl or localPath by imageNumber |
| Upload Status | "uploaded" if any image uploaded, else "pending" |

### Special Export Cases
- **Weight**: Convert from grams to original unit if known, else output in grams
- **Categories**: Extract from linked Category records by type
- **Additional Attributes**: Parse from AIContent.additionalAttributes JSON
- **ID**: Product.id (export only, ignored on import)

## Unit Conversions

### Weight Conversions (to grams)
- 1 kg = 1000 g
- 1 lb = 453.592 g
- 1 oz = 28.3495 g

### Length Conversions (to centimeters)
- 1 mm = 0.1 cm
- 1 in = 2.54 cm
- 1 ft = 30.48 cm

## Import Options

### Mode
- **upsert** (default): Create or update existing products
- **create-only**: Skip existing products
- **update-only**: Only update existing products

### Conflict Strategy
- **preferCsv** (default): CSV values override database
- **preferDb**: Database values preserved, CSV fills gaps

### Default Units
- **weight**: g, kg, lb, oz (default: g)
- **length**: cm, mm, in (default: cm)

## Validation Rules
1. UPC is required for all import operations
2. Numeric fields parsed with thousand separators support
3. Boolean fields support: yes/no, true/false, 1/0
4. Dates parsed as ISO format when possible
5. JSON fields validated before storage

## Error Handling
- Missing UPC: Row skipped with error
- Invalid numeric values: Set to null with warning
- Malformed JSON: Stored as plain text
- Duplicate SKU: Handled based on conflict strategy
- Image URL validation: Invalid URLs logged but not blocking
