'use client'

import React, { useState, useEffect, Suspense } from 'react'
import MainLayout from '@/components/MainLayout'
import { ArrowRight, ArrowLeft, Package, Sparkles, Save } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProductData {
  upc?: string
  title?: string
  brand?: string
  description?: string
  model?: string
  color?: string
  size?: string
  weight?: string
  dimensions?: string
  category?: string
  msrp?: number
}

function ProductDetailsContent() {
  const [productData, setProductData] = useState<ProductData>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const upc = searchParams.get('upc')
  const method = searchParams.get('method')

  useEffect(() => {
    // Simulate fetching product data based on UPC
    const fetchProductData = async () => {
      if (upc) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock product data
        setProductData({
          upc: upc,
          title: `Sample Product for UPC ${upc}`,
          brand: 'Sample Brand',
          description: 'This is a sample product description that would be populated from our product database or external API.',
          model: 'SB-001',
          color: 'Blue',
          size: 'Medium',
          weight: '2.5 lbs',
          dimensions: '10" x 6" x 4"',
          category: 'Electronics',
          msrp: 49.99
        })
      }
      setIsLoading(false)
    }

    fetchProductData()
  }, [upc])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate saving product data
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect to condition & photos step
      router.push(`/add-product/condition?upc=${upc}&method=${method}`)
    } catch (error) {
      console.error('Error saving product data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (field: keyof ProductData, value: string | number) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateAIContent = async () => {
    // Simulate AI content generation
    alert('AI content generation would be implemented here to enhance product descriptions, titles, and other details.')
  }

  if (isLoading) {
    return (
      <MainLayout title="Loading Product Details">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product information...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      title="Product Details"
      subtitle="Step 2 of 6 - Review and edit product information"
    >
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="text-sm font-medium text-green-600">Identify Product</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm font-medium text-blue-600">Product Details</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm text-gray-500">Condition & Photos</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href={`/add-product/${method || 'scan'}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                Step 2
              </div>
              <div className="text-sm text-gray-500">33% Complete</div>
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Product Information
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review and edit the product details below
                  </p>
                </div>
              </div>
              
              <button
                onClick={generateAIContent}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Enhance with AI</span>
              </button>
            </div>

            <form className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={productData.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={productData.brand || ''}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter brand name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={productData.model || ''}
                    onChange={(e) => handleFieldChange('model', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter model number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={productData.category || ''}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Books">Books</option>
                    <option value="Toys & Games">Toys & Games</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={productData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                />
              </div>

              {/* Physical Properties */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={productData.color || ''}
                    onChange={(e) => handleFieldChange('color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter color"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Size
                  </label>
                  <input
                    type="text"
                    value={productData.size || ''}
                    onChange={(e) => handleFieldChange('size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter size"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={productData.weight || ''}
                    onChange={(e) => handleFieldChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter weight"
                  />
                </div>
              </div>

              {/* Dimensions and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={productData.dimensions || ''}
                    onChange={(e) => handleFieldChange('dimensions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 10 x 6 x 4 inches"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    MSRP ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productData.msrp || ''}
                    onChange={(e) => handleFieldChange('msrp', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* UPC Display */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">UPC:</span>
                  <span className="text-sm font-mono bg-white dark:bg-gray-600 px-2 py-1 rounded border">
                    {productData.upc}
                  </span>
                  <span className="text-xs text-gray-500">
                    (Identified via {method || 'scan'})
                  </span>
                </div>
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center space-x-2 transition-colors"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Continue to Photos & Condition</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default function ProductDetailsPage() {
  return (
    <Suspense 
      fallback={
        <MainLayout title="Loading Product Details">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product information...</p>
            </div>
          </div>
        </MainLayout>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  )
}
