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
      
      if (result.candidates && result.candidates.length > 0) {
        setCandidates(result.candidates)
        setSelectedCandidate(0)
        setStep('selecting')
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
      // Search for product using the identified name and brand
      const searchQuery = candidate.brand 
        ? `${candidate.brand} ${candidate.name}`
        : candidate.name

      const response = await fetch('/api/products/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          category: candidate.category
        })
      })

      if (!response.ok) {
        throw new Error('Product search failed')
      }

      const productData = await response.json()
      
      // Enrich with AI-identified data if needed
      const enrichedData = {
        ...productData,
        aiDescription: candidate.description,
        aiCategory: candidate.category,
        aiAttributes: candidate.attributes,
        confidence: candidate.confidence
      }

      onProductIdentified(enrichedData)
    } catch (err) {
      console.error('Product search error:', err)
      setError('Failed to find product details. You can try another candidate or add manually.')
    } finally {
      setIsSearching(false)
    }
  }

  const resetFlow = () => {
    setImagePreview(null)
    setCandidates([])
    setSelectedCandidate(0)
    setError(null)
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
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
        {['Upload', 'Analyze', 'Select', 'Confirm'].map((label, index) => {
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
            Our AI is identifying products in your image
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
              Select the correct product below
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
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Product Details
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

      {/* Searching Section */}
      {step === 'searching' && (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Finding product details...
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Searching our database for &quot;{candidates[selectedCandidate]?.name}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
