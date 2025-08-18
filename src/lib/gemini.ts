import { GoogleGenerativeAI } from '@google/generative-ai'

interface ProductData {
  upc: string
  title?: string
  description?: string
  brand?: string
  category?: string
  color?: string
  size?: string
  weight?: string
  lowestPrice?: number
  highestPrice?: number
  offers?: {
    merchant: string
    price?: number
    condition?: string
  }[]
  images?: string[]
}

interface GeneratedContent {
  ebayTitle: string // 80 characters max
  seoTitle: string // Longer title for other platforms
  shortDescription: string // 150 characters max
  productDescription: string // 2000 characters max
  uniqueSellingPoints: string[]
  keyFeatures: string[]
  specifications: string[]
  itemSpecifics: Record<string, string>
  tags: string[]
  additionalAttributes: Record<string, string>
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private primaryModel: string
  private fallbackModel: string

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    this.primaryModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
    this.fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash'
    
    if (apiKey && apiKey !== 'your-gemini-api-key-here') {
      this.genAI = new GoogleGenerativeAI(apiKey)
    } else {
      console.warn('Gemini API key not configured. AI content generation will use mock data.')
    }
  }

  async generateProductContent(productData: ProductData): Promise<GeneratedContent> {
    if (!this.genAI) {
      return this.generateMockContent(productData)
    }

    try {
      // Try primary model first
      return await this.callGemini(productData, this.primaryModel)
    } catch (error) {
      console.warn(`Primary model ${this.primaryModel} failed, trying fallback:`, error)
      try {
        // Try fallback model
        return await this.callGemini(productData, this.fallbackModel)
      } catch (fallbackError) {
        console.error('Both Gemini models failed:', fallbackError)
        return this.generateMockContent(productData)
      }
    }
  }

  private async callGemini(productData: ProductData, modelName: string): Promise<GeneratedContent> {
    if (!this.genAI) throw new Error('Gemini AI not initialized')

    const model = this.genAI.getGenerativeModel({ model: modelName })

    const prompt = this.buildPrompt(productData)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return this.parseGeminiResponse(text, productData)
  }

  private buildPrompt(productData: ProductData): string {
    const { title, description, brand, category, color, size, weight, lowestPrice, highestPrice, offers } = productData

    const priceInfo = lowestPrice && highestPrice 
      ? `Price range: $${lowestPrice} - $${highestPrice}`
      : ''

    const offerInfo = offers && offers.length > 0 
      ? `Available from: ${offers.map(o => `${o.merchant} ($${o.price || 'N/A'})`).join(', ')}`
      : ''

    // Generate tag keywords from product data
    const tagKeywords = [
      brand,
      ...(title?.split(' ') || []),
      color,
      category?.split(' > ').pop()
    ].filter(Boolean)

    const additionalAttributes = [
      weight && `Weight: ${weight}`,
      color && `Color: ${color}`,
      size && `Size: ${size}`
    ].filter(Boolean).join('\n')

    return `Create an optimized product listing for the following product, strictly adhering to the specified format:

Product Details:

Title: ${title || 'Unknown Product'}
Short Description: ${description || 'Quality product'}
Description: ${description || 'Quality product with excellent features'}
UPC: ${productData.upc}
Quantity: Available
Brand: ${brand || 'Unknown Brand'}
Model: ${productData.upc}
Color: ${color || 'N/A'}
Size: ${size || 'N/A'}
Weight: ${weight || 'N/A'}
${priceInfo}
${offerInfo}
Tag Keywords: ${tagKeywords.join(', ')}
Additional Attributes:
${additionalAttributes}

Listing Sections:

Title: (up to 80 characters, including spaces)
- Create an attention-grabbing, Keyword Rich, SEO-optimized title that is descriptive and persuasive.

Short Description: (up to 150 characters)
- Write a concise, compelling summary of the product.

Description: (up to 2000 characters)
- Write a detailed, informative, and persuasive product description.
- Incorporate any relevant category-specific information seamlessly into the description without explicitly labeling it as category-specific.
- Use bullet points to highlight key features and specifications.
- Organize into concise paragraphs for readability.
- Include relevant measurements (if applicable).
- Mention the item's condition (new or used).
- Incorporate a clear "Add to Cart" call to action to encourage potential buyers.

Unique Selling Points:
- List 3-5 unique selling points.

Key Features:
- List 3-5 key features of the product

Specifications:
- List 3-5 important specifications of the product

Item Specifics:
- Brand: ${brand || '[Brand - Please Inquire]'}
- UPC: ${productData.upc}
- Color: ${color || '[Color - Please Inquire]'}
- Size: ${size || '[Size - Please Inquire]'}
- Weight: ${weight || '[Weight - Please Inquire]'}
- Condition: New

Tags:
- Generate a mix of 10-20 broad and specific tags, focusing on the product's key features, brand, and category.
- List each tag on a new line starting with a dash (-).
- Generate SEO keywords for the product.

Additional Attributes:
- List any additional attributes not covered in Item Specifics, one per line in the format "Attribute: Value".

Tone and Style:
- Maintain a friendly and approachable tone throughout the listing.

Important:
Ensure all sections are completed based on the available information.
If any required information is missing, make a best effort to complete the listing based on available details.
If critical information like size or color is missing, create a placeholder like "[Size - Please Inquire]" and suggest contacting the seller for details.

Please ensure that the output strictly adheres to the specified format and includes all the requested sections with the exact headers as indicated above.

Respond with JSON in this exact format:
{
  "ebayTitle": "80 character eBay title here",
  "seoTitle": "Longer SEO title for other platforms",
  "shortDescription": "150 character short description",
  "productDescription": "Full 2000 character product description with bullets and call to action",
  "uniqueSellingPoints": ["Point 1", "Point 2", "Point 3"],
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "specifications": ["Spec 1", "Spec 2", "Spec 3"],
  "itemSpecifics": {"Brand": "Brand Name", "UPC": "UPC Code", "Color": "Color", "Condition": "New"},
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "additionalAttributes": {"Attribute1": "Value1", "Attribute2": "Value2"}
}
`
  }

  private parseGeminiResponse(text: string, productData: ProductData): GeneratedContent {
    try {
      // Clean the response to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate required fields and provide defaults
      return {
        ebayTitle: parsed.ebayTitle || `${productData.title || 'Product'} - ${productData.brand || 'Brand'}`.substring(0, 80),
        seoTitle: parsed.seoTitle || `${productData.title || 'Product'} - ${productData.brand || 'Brand'} | Best Prices`,
        shortDescription: parsed.shortDescription || `Shop ${productData.title || 'this product'} from ${productData.brand || 'top brands'}.`.substring(0, 150),
        productDescription: parsed.productDescription || productData.description || 'High-quality product with excellent features and reliable performance.',
        uniqueSellingPoints: Array.isArray(parsed.uniqueSellingPoints) ? parsed.uniqueSellingPoints : [
          'Premium Quality Materials',
          'Exceptional Performance',
          'Great Value for Money'
        ],
        keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures : [
          'High-quality construction',
          'Reliable performance', 
          'User-friendly design'
        ],
        specifications: Array.isArray(parsed.specifications) ? parsed.specifications : [
          `Brand: ${productData.brand || 'Unknown'}`,
          `UPC: ${productData.upc}`,
          'Condition: New'
        ],
        itemSpecifics: parsed.itemSpecifics || {
          'Brand': productData.brand || 'Unknown',
          'UPC': productData.upc,
          'Condition': 'New'
        },
        tags: Array.isArray(parsed.tags) ? parsed.tags : [
          productData.brand?.toLowerCase(),
          productData.category?.toLowerCase(),
          'quality',
          'reliable'
        ].filter(Boolean),
        additionalAttributes: parsed.additionalAttributes || {}
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error)
      return this.generateMockContent(productData)
    }
  }

  private generateMockContent(productData: ProductData): GeneratedContent {
    const title = productData.title || 'Quality Product'
    const brand = productData.brand || 'Premium Brand'
    const ebayTitle = `${title} - ${brand}`.substring(0, 80)
    const shortDesc = `Shop ${title} from ${brand}. Premium quality.`.substring(0, 150)
    
    return {
      ebayTitle,
      seoTitle: `${title} - ${brand} | Best Prices & Fast Shipping`,
      shortDescription: shortDesc,
      productDescription: `Experience the exceptional quality of ${title} from ${brand}. This carefully crafted product combines innovative design with superior materials to deliver outstanding performance and reliability. Whether you're looking for everyday functionality or special occasions, this product meets the highest standards of quality and durability. 

• Premium quality construction and materials
• Exceptional performance and reliability
• Innovative design and attention to detail
• Suitable for various applications and uses
• Backed by customer satisfaction guarantee

Add to cart today for fast shipping and satisfaction guarantee!`,
      uniqueSellingPoints: [
        'Premium Quality Materials',
        'Exceptional Performance and Reliability',
        'Innovative Design and Attention to Detail',
        'Customer Satisfaction Guarantee',
        'Fast Shipping Available'
      ],
      keyFeatures: [
        'High-quality construction and materials',
        'Reliable performance and durability',
        'User-friendly design and operation',
        'Suitable for multiple applications',
        'Excellent customer support'
      ],
      specifications: [
        `Brand: ${brand}`,
        `UPC: ${productData.upc}`,
        'Condition: New',
        ...(productData.color ? [`Color: ${productData.color}`] : []),
        ...(productData.size ? [`Size: ${productData.size}`] : []),
        ...(productData.weight ? [`Weight: ${productData.weight}`] : [])
      ],
      itemSpecifics: {
        'Brand': brand,
        'UPC': productData.upc,
        'Condition': 'New',
        ...(productData.color && { 'Color': productData.color }),
        ...(productData.size && { 'Size': productData.size }),
        ...(productData.weight && { 'Weight': productData.weight })
      },
      tags: [
        brand.toLowerCase().replace(/\s+/g, '-'),
        'quality',
        'premium',
        'reliable',
        'innovative',
        'durable',
        'performance',
        'satisfaction-guaranteed',
        'fast-shipping',
        ...(productData.category ? [productData.category.toLowerCase().replace(/\s+/g, '-')] : [])
      ],
      additionalAttributes: {
        'Shipping': 'Fast shipping available',
        'Warranty': 'Satisfaction guarantee',
        'Category': productData.category || 'General Products',
        ...(productData.lowestPrice && { 'Price Range': `$${productData.lowestPrice} - $${productData.highestPrice || productData.lowestPrice}` })
      }
    }
  }

  async generateBulkContent(products: ProductData[]): Promise<(GeneratedContent & { productId: string })[]> {
    const results = []
    
    for (const product of products) {
      try {
        const content = await this.generateProductContent(product)
        results.push({
          ...content,
          productId: product.upc
        })
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate content for product ${product.upc}:`, error)
        results.push({
          ...this.generateMockContent(product),
          productId: product.upc
        })
      }
    }
    
    return results
  }

  isConfigured(): boolean {
    return this.genAI !== null
  }

  getModelInfo(): { primary: string, fallback: string, configured: boolean } {
    return {
      primary: this.primaryModel,
      fallback: this.fallbackModel,
      configured: this.isConfigured()
    }
  }
}

export const geminiService = new GeminiService()
export type { ProductData, GeneratedContent }
