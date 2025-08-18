'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Package, Edit, Save, X, ArrowLeft, Bot, ChevronLeft, ChevronRight, Eye, Trash2, Sparkles, Plus, ShoppingCart, Download } from 'lucide-react'
import Link from 'next/link'

interface ProductImage {
  id: string
  originalUrl: string
  localPath?: string
  imageNumber: number
}

interface Offer {
  id: string
  merchant: string
  price?: number
  listPrice?: number
  currency: string
  condition?: string
  availability?: string
  link?: string
}

interface Category {
  id: string
  name: string
  fullPath?: string
}

interface AIContent {
  id: string
  productId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  seoTitle?: string
  ebayTitle?: string
  shortDescription?: string
  productDescription?: string
  ebayBulletPoints?: string
  tags?: string
  uniqueSellingPoints?: string
  keyFeatures?: string
  itemSpecifics?: string
  additionalAttributes?: string
  aiModel?: string
  generatedAt?: string
}

interface Product {
  id: string
  upc: string
  ean?: string
  title?: string
  description?: string
  brand?: string
  model?: string
  color?: string
  size?: string
  weight?: string
  dimensions?: string
  quantity: number
  currency?: string
  lowestRecordedPrice?: number
  highestRecordedPrice?: number
  lastScanned?: string
  images: ProductImage[]
  offers: Offer[]
  categories: { category: Category }[]
  aiContent?: AIContent
}

interface EditForm {
  title?: string
  description?: string
  brand?: string
  model?: string
  color?: string
  size?: string
  weight?: string
  dimensions?: string
  quantity?: number
  // Funko Pop fields
  character?: string
  series?: string
  exclusivity?: string
  releaseDate?: string
  funkoPop?: boolean
  // eBay fields
  mpn?: string
  material?: string
  theme?: string
  ageGroup?: string
  aiContent?: {
    seoTitle?: string
    ebayTitle?: string
    shortDescription?: string
    productDescription?: string
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({})
  const [imageGallery, setImageGallery] = useState<{ isOpen: boolean; currentIndex: number }>({ isOpen: false, currentIndex: 0 })
  const [aiEnhancing, setAiEnhancing] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'ai' | 'images' | 'offers' | 'categories'>('basic')
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          brand: data.brand || '',
          model: data.model || '',
          color: data.color || '',
          size: data.size || '',
          weight: data.weight || '',
          dimensions: data.dimensions || '',
          quantity: data.quantity || 0,
          aiContent: data.aiContent ? {
            seoTitle: data.aiContent.seoTitle || '',
            ebayTitle: data.aiContent.ebayTitle || '',
            shortDescription: data.aiContent.shortDescription || '',
            productDescription: data.aiContent.productDescription || ''
          } : {}
        })
      } else {
        router.push('/inventory')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!product) return

    // Validation
    if (editForm.quantity !== undefined && editForm.quantity < 0) {
      alert('Quantity cannot be negative')
      return
    }

    if (editForm.aiContent) {
      const { seoTitle, ebayTitle, shortDescription, productDescription } = editForm.aiContent
      
      if (ebayTitle && ebayTitle.length > 80) {
        alert('eBay title cannot exceed 80 characters')
        return
      }
      
      if (seoTitle && seoTitle.length > 150) {
        alert('SEO title should be under 150 characters for optimal SEO')
        return
      }
      
      if (shortDescription && shortDescription.length > 500) {
        alert('Short description should be under 500 characters')
        return
      }
      
      if (productDescription && productDescription.length > 10000) {
        alert('Product description should be under 10,000 characters')
        return
      }
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await fetchProduct()
        setEditing(false)
        alert('Product updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to update product: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error updating product. Please check your connection and try again.')
    }
  }

  const handleAIEnhance = async () => {
    if (!product || aiEnhancing) return

    setAiEnhancing(true)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [product.id],
          regenerate: !!product.aiContent
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.summary.completed > 0) {
          await fetchProduct()
          alert('AI content generated successfully!')
        } else {
          alert('AI content generation failed')
        }
      } else {
        throw new Error('Failed to generate AI content')
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
      alert('Error generating AI content. Please try again.')
    } finally {
      setAiEnhancing(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    
    if (!confirm(`Are you sure you want to delete "${product.title || product.upc}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Product deleted successfully')
        router.push('/inventory')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete product: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const getProductImage = (index: number = 0) => {
    return product?.images?.[index]?.originalUrl || '/placeholder-product.svg'
  }

  const openImageGallery = (index: number = 0) => {
    setImageGallery({ isOpen: true, currentIndex: index })
  }

  const closeImageGallery = () => {
    setImageGallery({ isOpen: false, currentIndex: 0 })
  }

  const nextImage = () => {
    if (!product) return
    const nextIndex = (imageGallery.currentIndex + 1) % product.images.length
    setImageGallery(prev => ({ ...prev, currentIndex: nextIndex }))
  }

  const prevImage = () => {
    if (!product) return
    const prevIndex = imageGallery.currentIndex === 0 ? product.images.length - 1 : imageGallery.currentIndex - 1
    setImageGallery(prev => ({ ...prev, currentIndex: prevIndex }))
  }

  const getAIStatusIcon = (aiContent?: AIContent) => {
    if (!aiContent) return null
    
    switch (aiContent.status) {
      case 'completed':
        return <div className="w-3 h-3 bg-green-500 rounded-full" title="AI content completed" />
      case 'processing':
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="AI content processing" />
      case 'failed':
        return <div className="w-3 h-3 bg-red-500 rounded-full" title="AI content failed" />
      case 'pending':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full" title="AI content pending" />
      default:
        return null
    }
  }

  const getAveragePrice = () => {
    if (!product?.offers?.length) return null
    const validPrices = product.offers.filter(offer => offer.price && offer.price > 0).map(offer => offer.price!)
    if (validPrices.length === 0) return null
    return validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length
  }

  const handleDeleteImage = async (imageId: string, imageNumber: number) => {
    if (!product) return
    
    if (!confirm(`Are you sure you want to delete image #${imageNumber}? This action cannot be undone.`)) {
      return
    }

    setDeletingImageId(imageId)

    try {
      const response = await fetch(`/api/products/${product.id}/images/${imageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProduct()
        // Close image gallery if we were viewing the deleted image
        if (imageGallery.isOpen && product.images[imageGallery.currentIndex]?.id === imageId) {
          closeImageGallery()
        }
        alert('Image deleted successfully')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete image: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error deleting image')
    } finally {
      setDeletingImageId(null)
    }
  }

  const handleEbayExport = async () => {
    if (!product || exporting) return

    setExporting(true)

    try {
      const response = await fetch('/api/ebay/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [product.id],
          templateType: 'funko_toys_games_movies', // Default template
          useDynamicCategories: true
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ebay_export_${product.title?.replace(/[^a-zA-Z0-9]/g, '_') || product.upc}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('eBay export completed successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to export to eBay: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error exporting to eBay:', error)
      alert('Error exporting to eBay. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Product not found</h3>
          <Link
            href="/inventory"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/inventory" className="p-2 text-gray-400 hover:text-blue-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.title || `Product ${product.upc}`}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <span>UPC: {product.upc}</span>
                  {product.brand && <span>• Brand: {product.brand}</span>}
                  {product.aiContent && (
                    <div className="flex items-center space-x-1">
                      <span>• AI Content:</span>
                      {getAIStatusIcon(product.aiContent)}
                      <span className="capitalize">{product.aiContent.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Product</span>
                  </button>
                  <button
                    onClick={handleAIEnhance}
                    disabled={aiEnhancing}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {aiEnhancing ? (
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>{product.aiContent?.status === 'completed' ? 'Regenerate AI' : 'Generate AI Content'}</span>
                  </button>
                  <button
                    onClick={handleEbayExport}
                    disabled={exporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Export to eBay</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      // Reset form
                      setEditForm({
                        title: product.title || '',
                        description: product.description || '',
                        brand: product.brand || '',
                        model: product.model || '',
                        color: product.color || '',
                        size: product.size || '',
                        weight: product.weight || '',
                        dimensions: product.dimensions || '',
                        quantity: product.quantity || 0,
                        aiContent: product.aiContent ? {
                          seoTitle: product.aiContent.seoTitle || '',
                          ebayTitle: product.aiContent.ebayTitle || '',
                          shortDescription: product.aiContent.shortDescription || '',
                          productDescription: product.aiContent.productDescription || ''
                        } : {}
                      })
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'basic', label: 'Basic Info', icon: Package },
              { id: 'ai', label: 'AI Content', icon: Bot },
              { id: 'images', label: `Images (${product.images.length})`, icon: Eye },
              { id: 'offers', label: `Offers (${product.offers.length})`, icon: ShoppingCart },
              { id: 'categories', label: 'Categories', icon: Plus }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'basic' | 'ai' | 'images' | 'offers' | 'categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'basic' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Product Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Image */}
              <div className="space-y-4">
                <div 
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group relative"
                  onClick={() => openImageGallery(0)}
                >
                  <img
                    src={getProductImage(0)}
                    alt={product.title || `Product ${product.upc}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                    }}
                  />
                  {product.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {product.images.length} photos
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Inventory</h3>
                    <div className="text-2xl font-bold text-blue-600">{product.quantity}</div>
                    <div className="text-sm text-gray-500">Units in stock</div>
                  </div>
                  
                  {(product.lowestRecordedPrice || product.highestRecordedPrice) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Price Range</h3>
                      <div className="space-y-1">
                        {product.lowestRecordedPrice && (
                          <div className="text-sm">
                            <span className="text-gray-500">Low:</span>
                            <span className="text-green-600 font-semibold ml-2">
                              ${product.lowestRecordedPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {product.highestRecordedPrice && (
                          <div className="text-sm">
                            <span className="text-gray-500">High:</span>
                            <span className="text-green-600 font-semibold ml-2">
                              ${product.highestRecordedPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {getAveragePrice() && (
                          <div className="text-sm pt-1 border-t border-gray-200">
                            <span className="text-gray-500">Average:</span>
                            <span className="text-green-600 font-semibold ml-2">
                              ${getAveragePrice()!.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Center & Right Columns - Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {editing ? (
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter product title"
                      />
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <input
                          type="text"
                          value={editForm.brand || ''}
                          onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                        <input
                          type="text"
                          value={editForm.model || ''}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Physical Properties */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                        <input
                          type="text"
                          value={editForm.color || ''}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                        <input
                          type="text"
                          value={editForm.size || ''}
                          onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                        <input
                          type="text"
                          value={editForm.weight || ''}
                          onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Dimensions and Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
                        <input
                          type="text"
                          value={editForm.dimensions || ''}
                          onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="L x W x H"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <input
                          type="number"
                          value={editForm.quantity || 0}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Funko Pop Toggle */}
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editForm.funkoPop || false}
                          onChange={(e) => setEditForm({ ...editForm, funkoPop: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">This is a Funko Pop product</span>
                      </label>
                    </div>

                    {/* Funko Pop Fields */}
                    {editForm.funkoPop && (
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <h4 className="text-sm font-semibold text-purple-800 mb-3">Funko Pop Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Character</label>
                            <input
                              type="text"
                              value={editForm.character || ''}
                              onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="e.g., Batman, Spider-Man"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Series</label>
                            <input
                              type="text"
                              value={editForm.series || ''}
                              onChange={(e) => setEditForm({ ...editForm, series: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="e.g., DC Comics, Marvel"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Exclusivity</label>
                            <select
                              value={editForm.exclusivity || ''}
                              onChange={(e) => setEditForm({ ...editForm, exclusivity: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="">Select exclusivity</option>
                              <option value="Common">Common</option>
                              <option value="Exclusive">Exclusive</option>
                              <option value="Limited Edition">Limited Edition</option>
                              <option value="Convention Exclusive">Convention Exclusive</option>
                              <option value="Chase">Chase</option>
                              <option value="Vaulted">Vaulted</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Release Date</label>
                            <input
                              type="text"
                              value={editForm.releaseDate || ''}
                              onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder="e.g., 2023, Q1 2024"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional eBay Fields */}
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3">eBay Listing Fields</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">MPN (Manufacturer Part Number)</label>
                          <input
                            type="text"
                            value={editForm.mpn || ''}
                            onChange={(e) => setEditForm({ ...editForm, mpn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                          <input
                            type="text"
                            value={editForm.material || ''}
                            onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Vinyl, Plastic"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                          <input
                            type="text"
                            value={editForm.theme || ''}
                            onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Movies, Comics, TV Shows"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
                          <select
                            value={editForm.ageGroup || ''}
                            onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select age group</option>
                            <option value="3+">3+ years</option>
                            <option value="8+">8+ years</option>
                            <option value="13+">13+ years</option>
                            <option value="Adult">Adult (18+)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Enter product description"
                      />
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-6">
                    {/* Basic Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">UPC/EAN</dt>
                          <dd className="mt-1 text-sm text-gray-900">{product.upc}</dd>
                          {product.ean && (
                            <dd className="text-xs text-gray-500">EAN: {product.ean}</dd>
                          )}
                        </div>
                        {product.brand && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Brand</dt>
                            <dd className="mt-1 text-sm text-gray-900">{product.brand}</dd>
                          </div>
                        )}
                        {product.model && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Model</dt>
                            <dd className="mt-1 text-sm text-gray-900">{product.model}</dd>
                          </div>
                        )}
                        {product.color && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Color</dt>
                            <dd className="mt-1 text-sm text-gray-900">{product.color}</dd>
                          </div>
                        )}
                        {product.size && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Size</dt>
                            <dd className="mt-1 text-sm text-gray-900">{product.size}</dd>
                          </div>
                        )}
                        {product.weight && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Weight</dt>
                            <dd className="mt-1 text-sm text-gray-900">{product.weight}</dd>
                          </div>
                        )}
                        {product.dimensions && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                            <dd className="mt-1 text-sm text-gray-900">{product.dimensions}</dd>
                          </div>
                        )}
                        {product.lastScanned && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Last Scanned</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(product.lastScanned).toLocaleString()}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Bot className="w-6 h-6 text-purple-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">AI Generated Content</h2>
                  <div className="flex items-center space-x-2">
                    {product.aiContent && getAIStatusIcon(product.aiContent)}
                    <p className="text-sm text-gray-600">
                      Status: {product.aiContent?.status || 'Not generated'}
                      {product.aiContent?.generatedAt && 
                        ` • Generated ${new Date(product.aiContent.generatedAt).toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={handleAIEnhance}
                  disabled={aiEnhancing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  {aiEnhancing ? (
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{product.aiContent?.status === 'completed' ? 'Regenerate' : 'Generate'}</span>
                </button>
              )}
            </div>

            {product.aiContent || editing ? (
              <div className="space-y-6">
                {editing && editForm.aiContent !== undefined ? (
                  // Editing AI Content
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SEO Title 
                          <span className="text-xs text-gray-500 ml-1">(max 150 chars)</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.aiContent?.seoTitle || ''}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            aiContent: { ...editForm.aiContent, seoTitle: e.target.value } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          maxLength={150}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {(editForm.aiContent?.seoTitle || '').length}/150
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          eBay Title 
                          <span className="text-xs text-gray-500 ml-1">(max 80 chars)</span>
                        </label>
                        <input
                          type="text"
                          value={editForm.aiContent?.ebayTitle || ''}
                          onChange={(e) => setEditForm({ 
                            ...editForm, 
                            aiContent: { ...editForm.aiContent, ebayTitle: e.target.value } 
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          maxLength={80}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {(editForm.aiContent?.ebayTitle || '').length}/80
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Short Description 
                        <span className="text-xs text-gray-500 ml-1">(max 500 chars)</span>
                      </label>
                      <textarea
                        value={editForm.aiContent?.shortDescription || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          aiContent: { ...editForm.aiContent, shortDescription: e.target.value } 
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        maxLength={500}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(editForm.aiContent?.shortDescription || '').length}/500
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Description 
                        <span className="text-xs text-gray-500 ml-1">(max 10,000 chars)</span>
                      </label>
                      <textarea
                        value={editForm.aiContent?.productDescription || ''}
                        onChange={(e) => setEditForm({ 
                          ...editForm, 
                          aiContent: { ...editForm.aiContent, productDescription: e.target.value } 
                        })}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        maxLength={10000}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {(editForm.aiContent?.productDescription || '').length}/10,000
                      </div>
                    </div>

                  </div>
                ) : (
                  // Display AI Content
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.aiContent?.seoTitle && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">SEO Title</h4>
                          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{product.aiContent.seoTitle}</p>
                        </div>
                      )}
                      {product.aiContent?.ebayTitle && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">eBay Title</h4>
                          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{product.aiContent.ebayTitle}</p>
                        </div>
                      )}
                    </div>

                    {product.aiContent?.shortDescription && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Short Description</h4>
                        <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{product.aiContent.shortDescription}</p>
                      </div>
                    )}

                    {product.aiContent?.productDescription && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Product Description</h4>
                        <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                          {product.aiContent.productDescription}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.aiContent?.tags && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {product.aiContent.tags.split(',').map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.aiContent?.keyFeatures && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features</h4>
                          <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{product.aiContent.keyFeatures}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Content Generated</h3>
                <p className="text-gray-600 mb-4">Generate SEO-optimized content for this product using AI</p>
                <button
                  onClick={handleAIEnhance}
                  disabled={aiEnhancing}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {aiEnhancing ? (
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate AI Content
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'images' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Product Images ({product.images.length})</h2>
              {/* TODO: Add image management buttons */}
            </div>

            {product.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.originalUrl || '/placeholder-product.svg'}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openImageGallery(index)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                        }}
                      />
                    </div>
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      #{image.imageNumber}
                    </div>
                    {/* Delete button - higher z-index to appear above overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImage(image.id, image.imageNumber)
                      }}
                      disabled={deletingImageId === image.id}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 z-20"
                      title="Delete image"
                    >
                      {deletingImageId === image.id ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                    {/* Removed problematic overlay */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Images</h3>
                <p className="text-gray-600">No images found for this product</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Market Offers ({product.offers.length})</h2>

            {product.offers.length > 0 ? (
              <div className="space-y-4">
                {getAveragePrice() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Average Market Price</h4>
                        <p className="text-lg font-bold text-green-600">${getAveragePrice()!.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {product.offers.map((offer) => (
                    <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{offer.merchant}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            {offer.condition && (
                              <span>Condition: {offer.condition}</span>
                            )}
                            {offer.availability && (
                              <span>• {offer.availability}</span>
                            )}
                            <span>• Currency: {offer.currency}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {offer.price && (
                            <div className="text-lg font-semibold text-green-600">
                              ${offer.price.toFixed(2)}
                            </div>
                          )}
                          {offer.listPrice && offer.listPrice !== offer.price && (
                            <div className="text-sm text-gray-500 line-through">
                              List: ${offer.listPrice.toFixed(2)}
                            </div>
                          )}
                          {offer.link && (
                            <a
                              href={offer.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Offer →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Market Offers</h3>
                <p className="text-gray-600">No offers found for this product</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Product Categories</h2>

            {product.categories.length > 0 ? (
              <div className="space-y-3">
                {product.categories.map((cat) => (
                  <div key={cat.category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{cat.category.name}</h4>
                      {cat.category.fullPath && (
                        <p className="text-sm text-gray-600">{cat.category.fullPath}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Category
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories</h3>
                <p className="text-gray-600">No categories assigned to this product</p>
                {/* TODO: Add category assignment */}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Gallery Modal */}
      {imageGallery.isOpen && product.images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={closeImageGallery}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation - Previous */}
            {product.images.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Navigation - Next */}
            {product.images.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={product.images[imageGallery.currentIndex]?.originalUrl || '/placeholder-product.svg'}
                alt={`${product.title || 'Product'} - Image ${imageGallery.currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                }}
              />
            </div>

            {/* Image Counter */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                {imageGallery.currentIndex + 1} of {product.images.length}
              </div>
            )}

            {/* Product Info Overlay */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg max-w-sm">
              <h3 className="font-semibold text-sm mb-1">
                {product.title || `UPC: ${product.upc}`}
              </h3>
              {product.brand && (
                <p className="text-xs opacity-75">{product.brand}</p>
              )}
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setImageGallery(prev => ({ ...prev, currentIndex: index }))}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === imageGallery.currentIndex 
                        ? 'border-white' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.originalUrl || '/placeholder-product.svg'}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain bg-gray-900"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
