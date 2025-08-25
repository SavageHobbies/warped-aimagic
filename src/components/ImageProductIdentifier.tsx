'use client'

import React, { useState, useRef, useCallback } from 'react'
import { 
  Upload, Camera, Loader2, Check, X, Search, 
  ChevronLeft, ChevronRight, Sparkles, ImageIcon,
  AlertCircle, Package, ArrowRight
} from 'lucide-react'
import Button from './ui/Button'
import { Card, CardContent } from './ui/Card'

interface ProductCandidate {
  name: string
  brand?: string
  description?: string
  confidence: number
  category?: string
  upc?: string
  attributes?: Record<string, string>
  imageUrl?: string
}

interface ImageProductIdentifierProps {
  onProductIdentified: (productData: Record<string, unknown>) => void
  isProcessing?: boolean
}

export default function ImageProductIdentifier({ 
  onProductIdentified, 
  isProcessing = false 
}: ImageProductIdentifierProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [candidates, setCandidates] = useState<ProductCandidate[]>([])
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<number>(0)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'analyzing' | 'selecting' | 'searching'>('upload')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = useCallback(async (file: File) => {
    setError(null)
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('Image size must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Analyze image
    setStep('analyzing')
    setIsAnalyzing(true)

    try {
      const base64 = await fileToBase64(file)
      const response = await fetch('/api/vision/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          mimeType: file.type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze image')
      }

      const result = await response.json()
      
      // Store the full analysis result for later use
      setAnalysisResult(result)
      
      if (result.candidates && result.candidates.length > 0) {
        setCandidates(result.candidates)
        setSelectedCandidate(0)
        setStep('selecting')
        
        // Log UPC detection results
        console.log('Vision Analysis Complete:')
        console.log('- Found candidates:', result.candidates.length)
        console.log('- Overall foundUPC:', result.foundUPC)
        console.log('- Candidate UPCs:', result.candidates.map((c: any, i: number) => `${i}: ${c.upc || 'none'}`).join(', '))
      } else {
        setError('No products identified in the image. Please try another image.')
        setStep('upload')
      }
    } catch (err) {
      console.error('Image analysis error:', err)
      setError('Failed to analyze image. Please try again.')
      setStep('upload')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleProductSearch = async () => {
    const candidate = candidates[selectedCandidate]
    if (!candidate) return

    setStep('searching')
    setIsSearching(true)
    setError(null)

    try {
      // PRIORITY 1: Check if UPC was found during initial product identification
      let upcToUse: string | null = candidate.upc || null
      let upcSource: string = 'none'
      
      console.log('UPC Analysis:')
      console.log('- UPC from AI product identification:', candidate.upc)
      
      if (upcToUse) {
        upcSource = 'ai_candidate'
      }
      
      // PRIORITY 1.5: Check if foundUPC was detected in the overall vision analysis
      if (!upcToUse && analysisResult?.foundUPC) {
        upcToUse = analysisResult.foundUPC
        upcSource = 'vision_analysis'
        console.log('- UPC from vision analysis foundUPC field:', upcToUse)
      }
      
      // PRIORITY 2: If no UPC from product identification, try to extract from image
      if (!upcToUse && imagePreview) {
        console.log('- No UPC from product ID, extracting from image...')
        try {
          const textResponse = await fetch('/api/vision/extract-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: imagePreview.split(',')[1], // Remove data:image/jpeg;base64, prefix
              mimeType: 'image/jpeg'
            })
          })
          
          if (textResponse.ok) {
            const textResult = await textResponse.json()
            upcToUse = textResult.barcode || null
            if (upcToUse) {
              upcSource = 'text_extraction'
            }
            console.log('- UPC from text extraction:', upcToUse)
          }
        } catch (err) {
          console.log('- Text extraction failed:', err)
        }
      }

      // PRIORITY 3: If still no UPC, try searching by product name
      if (!upcToUse && candidate.name) {
        console.log('- No UPC from image extraction, searching by product name...')
        try {
          const searchResponse = await fetch('/api/products/search-upc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName: candidate.name,
              brand: candidate.brand
            })
          })
          
          if (searchResponse.ok) {
            const searchResult = await searchResponse.json()
            if (searchResult.upc) {
              upcToUse = searchResult.upc
              upcSource = 'name_search'
              console.log('- UPC from product name search:', upcToUse)
              console.log('- Search details:', {
                source: searchResult.searchSource,
                query: `${candidate.brand || ''} ${candidate.name}`.trim(),
                matches: searchResult.totalResults,
                usage: searchResult.usage
              })
            } else {
              console.log('- No UPC found in search results from either database')
            }
          } else {
            console.log('- Product name search failed:', searchResponse.status)
          }
        } catch (err) {
          console.log('- Product name search error:', err)
        }
      }

      // If we have a UPC (from either source), use the standard product lookup API
      if (upcToUse) {
        console.log(`✅ Using UPC as source of truth: ${upcToUse}`)
        console.log(`🤖 AI identified:`, {
          name: candidate.name,
          brand: candidate.brand,
          confidence: candidate.confidence
        })
        
        const response = await fetch('/api/products/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            upc: upcToUse,
            addToInventory: true,
            quantity: 1
          })
        })

        if (response.ok) {
          let result = await response.json()
          
          // Enhanced data reconciliation logic to prioritize AI identification
          const aiTitle = candidate.name?.toLowerCase() || ''
          const aiBrand = candidate.brand?.toLowerCase() || ''
          const upcTitle = result.title?.toLowerCase() || ''
          const upcBrand = result.brand?.toLowerCase() || ''
          
          // More sophisticated similarity checks
          const titleWordsMatch = calculateWordOverlap(aiTitle, upcTitle)
          const brandMatches = aiBrand === upcBrand || 
                              (aiBrand && upcBrand && (aiBrand.includes(upcBrand) || upcBrand.includes(aiBrand)))
          
          // Check for completely different product categories (e.g., Funko vs Food)
          const aiCategory = candidate.category?.toLowerCase() || ''
          const categoryMismatch = detectCategoryMismatch(aiCategory, upcTitle, aiTitle)
          
          // Use AI confidence as a factor - high confidence AI should override UPC data
          const highConfidenceAI = candidate.confidence > 0.8
          
          // Decide if we should prioritize AI identification
          const shouldPrioritizeAI = categoryMismatch || 
                                    titleWordsMatch < 0.3 || 
                                    !brandMatches || 
                                    (highConfidenceAI && titleWordsMatch < 0.5)
          
          console.log('🔍 Data Reconciliation Analysis:')
          console.log('  AI Identified:', { title: candidate.name, brand: candidate.brand, category: candidate.category, confidence: candidate.confidence })
          console.log('  UPC Database:', { title: result.title, brand: result.brand })
          console.log('  Metrics:', { titleWordsMatch, brandMatches, categoryMismatch, highConfidenceAI, shouldPrioritizeAI })
          
          // If AI identification should be prioritized, update the product
          if (shouldPrioritizeAI) {
            console.log('🤖 PRIORITIZING AI IDENTIFICATION - Significant mismatch detected')
            console.log('  Reason:', categoryMismatch ? 'Category mismatch' : 
                                     titleWordsMatch < 0.3 ? 'Low title similarity' : 
                                     !brandMatches ? 'Brand mismatch' : 'High confidence AI with poor match')
            
            // Update the product with AI-identified information
            try {
              const updateResponse = await fetch(`/api/products/${result.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: candidate.name, // PRIORITIZE AI-identified title
                  brand: candidate.brand, // PRIORITIZE AI-identified brand
                  description: candidate.description || result.description,
                  category: candidate.category || result.category,
                  // Keep UPC database data for technical specs only
                  condition: result.condition,
                  weight: result.weight,
                  dimensions: result.dimensions,
                  // Store both data sources for transparency
                  aiGeneratedContent: {
                    ...result.aiGeneratedContent,
                    aiIdentifiedTitle: candidate.name,
                    aiIdentifiedBrand: candidate.brand,
                    aiIdentifiedDescription: candidate.description,
                    aiIdentifiedCategory: candidate.category,
                    upcDatabaseTitle: result.title,
                    upcDatabaseBrand: result.brand,
                    confidenceScore: candidate.confidence,
                    identificationMethod: upcSource,
                    dataEnriched: true,
                    enrichedAt: new Date().toISOString(),
                    aiPrioritized: true,
                    reconciliationReason: categoryMismatch ? 'category_mismatch' : 
                                         titleWordsMatch < 0.3 ? 'low_title_similarity' : 
                                         !brandMatches ? 'brand_mismatch' : 'high_confidence_ai'
                  }
                })
              })
              
              if (updateResponse.ok) {
                const updatedResult = await updateResponse.json()
                console.log('✅ Successfully updated product with AI-prioritized information')
                result = updatedResult // Use the updated product data
              }
            } catch (updateError) {
              console.warn('⚠️ Failed to update product with AI data:', updateError)
            }
          } else {
            console.log('✅ UPC database data appears accurate, keeping with AI enhancements')
          }
          
          // Enrich UPC-based data with AI-identified insights
          const enrichedData = {
            ...result,
            aiDescription: candidate.description,
            aiCategory: candidate.category,
            aiAttributes: candidate.attributes,
            aiConfidence: candidate.confidence,
            identificationMethod: upcSource === 'ai_candidate'
              ? 'ai_with_upc' 
              : upcSource === 'vision_analysis'
                ? 'vision_analysis_upc'
                : upcSource === 'name_search'
                  ? 'product_name_search_upc'
                  : 'image_text_extraction_upc',
            aiExtractedBrand: candidate.brand,
            titleCorrected: shouldPrioritizeAI,
            brandCorrected: shouldPrioritizeAI && !brandMatches,
            message: upcSource === 'ai_candidate'
              ? `✅ Product found via AI-detected UPC (${upcToUse}) and added to inventory! Enhanced with AI insights. Confidence: ${Math.round(candidate.confidence * 100)}%`
              : upcSource === 'vision_analysis'
                ? `✅ Product found via vision-detected UPC (${upcToUse}) and added to inventory! Enhanced with AI insights. Confidence: ${Math.round(candidate.confidence * 100)}%`
                : upcSource === 'name_search'
                  ? `🔍 Product found via name search UPC (${upcToUse}) and added to inventory! Enhanced with AI insights. Confidence: ${Math.round(candidate.confidence * 100)}%`
                  : `✅ Product found via extracted UPC (${upcToUse}) and added to inventory! Enhanced with AI insights. Confidence: ${Math.round(candidate.confidence * 100)}%`
          }

          onProductIdentified(enrichedData)
          return
        } else {
          console.log('UPC lookup failed, falling back to AI-only creation')
        }
      } else {
        console.log('⚠️ No UPC found - using AI-only product creation as fallback')
      }

      // If no UPC found or UPC lookup failed, create product with available data
      console.log('Adding product using AI-identified information')
      
      // Use UPC as primary identifier if available, otherwise generate SKU
      const productData: any = {
        title: candidate.name,
        brand: candidate.brand,
        description: candidate.description,
        category: candidate.category,
        condition: 'new', // Default condition (lowercase to match database)
        quantity: 1,
        
        // Store AI metadata
        aiGeneratedContent: {
          confidence: candidate.confidence,
          extractedFromImage: true,
          attributes: candidate.attributes,
          imageAnalysisDate: new Date().toISOString(),
          upcAttempted: upcToUse || null // Track if we tried to use a UPC
        }
      }

      // Use UPC as primary identifier if found, otherwise generate SKU
      if (upcToUse) {
        productData.upc = upcToUse
        console.log(`📊 Using UPC as primary identifier: ${upcToUse}`)
      } else {
        const generatedId = `IMG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        productData.sku = generatedId
        console.log(`🏷️ No UPC available, using generated SKU: ${generatedId}`)
      }

      const addResponse = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })

      if (!addResponse.ok) {
        const errorData = await addResponse.json()
        console.error('Product creation failed:', errorData)
        throw new Error(`Failed to add product to inventory: ${errorData.details || errorData.error}`)
      }

      const addResult = await addResponse.json()
      const newProduct = addResult.product || addResult // Handle both response formats
      
      // Try to create a listing draft for the new product
      try {
        const draftResponse = await fetch('/api/listings/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: newProduct.id,
            marketplace: 'EBAY',
            price: 0, // No price information from image
            quantity: 1
          })
        })
        
        if (draftResponse.ok) {
          const draft = await draftResponse.json()
          newProduct.draftId = draft.id
        }
      } catch (error) {
        console.error('Error creating draft:', error)
      }

      // Enrich with identification metadata
      const enrichedData = {
        ...newProduct,
        aiDescription: candidate.description,
        aiCategory: candidate.category,
        aiAttributes: candidate.attributes,
        aiConfidence: candidate.confidence,
        identificationMethod: upcToUse ? 'image_with_upc_fallback' : 'image_only',
        isNewProduct: true,
        usedUPC: upcToUse,
        upcSource: upcSource,
        message: upcToUse 
          ? `✨ Product identified from image with UPC ${upcToUse} (via ${upcSource.replace('_', ' ')}) and added to inventory! Confidence: ${Math.round(candidate.confidence * 100)}%`
          : `✨ Product identified from image and added to inventory! No UPC found despite comprehensive search. Confidence: ${Math.round(candidate.confidence * 100)}%`
      }

      onProductIdentified(enrichedData)
      
    } catch (err) {
      console.error('Product processing error:', err)
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to add product to inventory. You can try another candidate or add manually.'
      )
      setStep('selecting') // Go back to selection to try another candidate
    } finally {
      setIsSearching(false)
    }
  }

  const resetFlow = () => {
    setImagePreview(null)
    setCandidates([])
    setAnalysisResult(null)
    setSelectedCandidate(0)
    setError(null)
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  // Helper method for calculating word overlap between two strings
  const calculateWordOverlap = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0
    
    const words1 = str1.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    const words2 = str2.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    
    if (words1.length === 0 || words2.length === 0) return 0
    
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }

  // Helper method for detecting category mismatches (e.g., Toys vs Food)
  const detectCategoryMismatch = (aiCategory: string, upcTitle: string, aiTitle: string): boolean => {
    const categories = {
      toys: ['toy', 'funko', 'pop', 'figure', 'collectible', 'action', 'doll', 'plush'],
      food: ['gourmet', 'popcorn', 'snack', 'food', 'candy', 'chocolate', 'beverage'],
      electronics: ['electronic', 'device', 'gadget', 'tech', 'computer', 'phone'],
      clothing: ['shirt', 'dress', 'pants', 'clothing', 'apparel', 'fashion'],
      books: ['book', 'novel', 'guide', 'manual', 'literature'],
      media: ['dvd', 'blu-ray', 'cd', 'movie', 'film', 'music']
    }
    
    const detectCategory = (text: string): string[] => {
      const detectedCategories: string[] = []
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
          detectedCategories.push(category)
        }
      }
      return detectedCategories
    }
    
    const aiCategories = detectCategory(aiTitle + ' ' + aiCategory)
    const upcCategories = detectCategory(upcTitle)
    
    // If we detect categories and they don't overlap, it's a mismatch
    if (aiCategories.length > 0 && upcCategories.length > 0) {
      const hasOverlap = aiCategories.some(cat => upcCategories.includes(cat))
      return !hasOverlap
    }
    
    return false
  }

  const navigateCandidate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedCandidate > 0) {
      setSelectedCandidate(selectedCandidate - 1)
    } else if (direction === 'next' && selectedCandidate < candidates.length - 1) {
      setSelectedCandidate(selectedCandidate + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-2">
        {['Upload', 'Analyze', 'Select', 'Add to Inventory'].map((label, index) => {
          const isActive = 
            (step === 'upload' && index === 0) ||
            (step === 'analyzing' && index === 1) ||
            (step === 'selecting' && index === 2) ||
            (step === 'searching' && index === 3)
          
          const isComplete =
            (step !== 'upload' && index === 0) ||
            ((step === 'selecting' || step === 'searching') && index === 1) ||
            (step === 'searching' && index === 2)

          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white scale-110 shadow-lg' 
                    : isComplete
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
                `}>
                  {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`
                  text-xs mt-1 ${isActive ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  {label}
                </span>
              </div>
              {index < 3 && (
                <div className={`
                  w-12 h-0.5 transition-all duration-300
                  ${isComplete ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                `} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Upload Section */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors">
            <div className="space-y-4">
              <div className="relative inline-block">
                <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
                <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Upload or capture a product image
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Our AI will identify the product and find matching details
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="inline-block">
                  <span className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </span>
                </label>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="camera-capture"
                />
                <label htmlFor="camera-capture" className="inline-block">
                  <span className="inline-flex items-center justify-center px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-muted cursor-pointer transition-colors">
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
              Tips for best results:
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Use clear, well-lit images</li>
              <li>• Include product labels and packaging</li>
              <li>• Avoid blurry or dark photos</li>
              <li>• Center the product in frame</li>
            </ul>
          </div>
        </div>
      )}

      {/* Analyzing Section */}
      {step === 'analyzing' && (
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Analyzing your image...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Our AI is identifying products, extracting UPC codes, and preparing database searches
          </p>
          {imagePreview && (
            <div className="mt-6 flex justify-center">
              <img 
                src={imagePreview} 
                alt="Uploaded product" 
                className="max-w-xs max-h-48 rounded-lg shadow-lg object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* Selection Section */}
      {step === 'selecting' && candidates.length > 0 && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              We found {candidates.length} possible match{candidates.length > 1 ? 'es' : ''}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select the correct product and we'll add it to your inventory using UPC detection
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              🔍 If no UPC is visible, we'll search UPCDatabase.org & UPCItemDB by product name
            </p>
          </div>

          <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-white to-emerald-50/20 dark:from-gray-800 dark:to-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Package className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                      {candidates[selectedCandidate].name}
                    </h4>
                  </div>
                  
                  {candidates[selectedCandidate].brand && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span className="font-medium">Brand:</span> {candidates[selectedCandidate].brand}
                    </p>
                  )}
                  
                  {candidates[selectedCandidate].upc && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
                      <span className="font-medium">✅ UPC Found:</span> {candidates[selectedCandidate].upc}
                    </p>
                  )}
                  
                  {!candidates[selectedCandidate].upc && analysisResult?.foundUPC && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1 font-medium">
                      <span className="font-medium">✅ UPC Detected in Image:</span> {analysisResult.foundUPC}
                    </p>
                  )}
                  
                  {!candidates[selectedCandidate].upc && !analysisResult?.foundUPC && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-1 font-medium">
                      <span className="font-medium">⚠️ No UPC Found:</span> Will use AI identification only
                    </p>
                  )}
                  
                  {candidates[selectedCandidate].category && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <span className="font-medium">Category:</span> {candidates[selectedCandidate].category}
                    </p>
                  )}
                  
                  {candidates[selectedCandidate].description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {candidates[selectedCandidate].description}
                    </p>
                  )}

                  <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">
                      Confidence:
                    </span>
                    <div className="flex-1 max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${candidates[selectedCandidate].confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 ml-2">
                      {Math.round(candidates[selectedCandidate].confidence * 100)}%
                    </span>
                  </div>
                </div>

                {imagePreview && (
                  <div className="ml-4 flex-shrink-0">
                    <img 
                      src={imagePreview} 
                      alt="Product" 
                      className="w-24 h-24 object-cover rounded-lg shadow"
                    />
                  </div>
                )}
              </div>

              {/* Navigation for multiple candidates */}
              {candidates.length > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateCandidate('prev')}
                    disabled={selectedCandidate === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedCandidate + 1} of {candidates.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateCandidate('next')}
                    disabled={selectedCandidate === candidates.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetFlow}>
              <X className="w-4 h-4 mr-2" />
              Try Another Image
            </Button>
            <Button 
              variant="primary" 
              onClick={handleProductSearch}
              disabled={isSearching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding to Inventory...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Add to Inventory
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {error}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Adding to Inventory Section */}
      {step === 'searching' && (
        <div className="text-center py-12">
          <div className="relative inline-block mb-6">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <Package className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Adding product to inventory...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Looking up "{candidates[selectedCandidate]?.name}" via UPC and gathering comprehensive product details
          </p>
        </div>
      )}
    </div>
  )
}
