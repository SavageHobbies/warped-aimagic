import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ProductCandidate {
  name: string
  brand?: string
  description?: string
  confidence: number
  category?: string
  upc?: string
  attributes?: Record<string, string>
}

export interface VisionAnalysisResult {
  candidates: ProductCandidate[]
  extractedText?: string
  imageDescription?: string
  suggestedCategory?: string
  foundUPC?: string
}

class GeminiVisionService {
  private genAI: GoogleGenerativeAI | null = null
  private visionModel: string = 'gemini-2.0-flash-exp'

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (apiKey && apiKey !== 'your-gemini-api-key-here') {
      this.genAI = new GoogleGenerativeAI(apiKey)
      console.log('Gemini Vision Service: Initialized successfully')
    } else {
      console.warn('Gemini Vision Service: API key not configured')
    }
  }

  /**
   * Identify products from an image
   */
  async identifyProducts(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<VisionAnalysisResult> {
    if (!this.genAI) {
      return this.getMockVisionResult()
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.visionModel,
        generationConfig: {
          temperature: 0.4,
          topP: 1,
          topK: 32,
          maxOutputTokens: 4096,
        }
      })

      const prompt = `Analyze this image and identify any products visible. CRITICAL: Look for UPC/barcode numbers first - they are the most important identifier.

For each product found:
1. FIRST: Look carefully for any UPC/EAN/barcode numbers (12-13 digits) - check packaging, labels, stickers
2. Provide the product name (be specific, include model numbers if visible)
3. Identify the brand/manufacturer
4. Describe the product briefly
5. Estimate your confidence level (0-1)
6. Suggest a product category
7. Extract any visible text, specifications, or attributes

Return the response in this exact JSON format:
{
  "candidates": [
    {
      "name": "Product name with model if visible",
      "brand": "Brand name",
      "description": "Brief product description",
      "confidence": 0.9,
      "category": "Product category",
      "upc": "UPC/barcode number if visible (PRIORITY)",
      "attributes": {
        "color": "if visible",
        "size": "if visible",
        "model": "if visible"
      }
    }
  ],
  "extractedText": "Any text visible in the image",
  "imageDescription": "Overall description of what's in the image",
  "suggestedCategory": "Most likely product category",
  "foundUPC": "UPC/barcode if clearly visible"
}

Focus on accuracy and UPC extraction. If you can see a UPC/barcode, include it in both the candidate and foundUPC fields.`

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }

      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()

      return this.parseVisionResponse(text)
    } catch (error) {
      console.error('Gemini Vision error:', error)
      return this.getMockVisionResult()
    }
  }

  /**
   * Compare two product images to determine if they're the same product
   */
  async compareProductImages(
    image1Base64: string, 
    image2Base64: string,
    mimeType: string = 'image/jpeg'
  ): Promise<{ isSameProduct: boolean; confidence: number; reasoning: string }> {
    if (!this.genAI) {
      return {
        isSameProduct: false,
        confidence: 0.5,
        reasoning: 'Vision API not configured'
      }
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.visionModel })

      const prompt = `Compare these two product images and determine if they show the same product.
Consider:
- Product type and category
- Brand and model
- Color and design
- Packaging (if visible)
- Any visible text or labels

Return JSON:
{
  "isSameProduct": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: image1Base64, mimeType } },
        { inlineData: { data: image2Base64, mimeType } }
      ])

      const response = await result.response
      const text = response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Image comparison error:', error)
    }

    return {
      isSameProduct: false,
      confidence: 0.5,
      reasoning: 'Unable to compare images'
    }
  }

  /**
   * Extract text from product packaging or labels
   */
  async extractProductText(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{
    text: string
    barcode?: string
    productInfo?: Record<string, string>
  }> {
    if (!this.genAI) {
      return { text: '', productInfo: {} }
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.visionModel })

      const prompt = `Extract all visible text from this product image, especially:
- Product name and brand
- Barcode/UPC numbers
- Specifications
- Ingredients or contents
- Weight/size/dimensions
- Manufacturer information
- Any warnings or certifications

Return JSON:
{
  "text": "All extracted text",
  "barcode": "Barcode if visible",
  "productInfo": {
    "name": "Product name",
    "brand": "Brand",
    "weight": "Weight if visible",
    "size": "Size if visible"
  }
}`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType } }
      ])

      const response = await result.response
      const text = response.text()
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('Text extraction error:', error)
    }

    return { text: '', productInfo: {} }
  }

  /**
   * Generate a product description from an image
   */
  async generateProductDescription(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
    if (!this.genAI) {
      return 'Unable to generate description'
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.visionModel })

      const prompt = `Create a detailed product description for this item suitable for an inventory system.
Include:
- What the product is
- Key features visible
- Condition (new/used/damaged)
- Any notable characteristics
- Approximate size or scale

Keep it concise but informative (150-200 words).`

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType } }
      ])

      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Description generation error:', error)
      return 'Unable to generate description'
    }
  }

  private parseVisionResponse(text: string): VisionAnalysisResult {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      
      const parsed = JSON.parse(jsonMatch[0])
      
      // Validate and clean up the response
      return {
        candidates: Array.isArray(parsed.candidates) 
          ? parsed.candidates.map((c: any) => ({
              name: c.name || 'Unknown Product',
              brand: c.brand,
              description: c.description,
              confidence: typeof c.confidence === 'number' ? c.confidence : 0.5,
              category: c.category,
              upc: c.upc,
              attributes: c.attributes || {}
            }))
          : [],
        extractedText: parsed.extractedText,
        imageDescription: parsed.imageDescription,
        suggestedCategory: parsed.suggestedCategory,
        foundUPC: parsed.foundUPC
      }
    } catch (error) {
      console.error('Failed to parse vision response:', error)
      return this.getMockVisionResult()
    }
  }

  private getMockVisionResult(): VisionAnalysisResult {
    return {
      candidates: [
        {
          name: 'Sample Product',
          brand: 'Generic Brand',
          description: 'A sample product for testing',
          confidence: 0.7,
          category: 'General',
          attributes: {}
        }
      ],
      extractedText: 'Sample text',
      imageDescription: 'An image of a product',
      suggestedCategory: 'General'
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null
  }
}

export const geminiVisionService = new GeminiVisionService()
