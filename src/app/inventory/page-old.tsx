'use client'

import React, { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { 
  Package, 
  Edit, 
  Save, 
  X, 
  ArrowLeft,
  Bot, 
  Eye, 
  Download, 
  Trash2, 
  Sparkles, 
  ChevronLeft,
  ChevronRight,
  ShoppingCart
} from 'lucide-react'
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
  material?: string
  condition?: 'New' | 'Used' | 'Refurbished' | 'Damaged' | 'Unknown'
  msrp?: number
  purchasePrice?: number
  listingPrice?: number
  quantity: number
  currency?: string
  lowestRecordedPrice?: number
  highestRecordedPrice?: number
  lastScanned?: string
  images: ProductImage[]
  offers: Offer[]
  categories: { category: Category }[]
  aiContent?: AIContent
  // eBay-specific fields
  itemSpecifics?: { [key: string]: string }
  listingStatus?: 'draft' | 'active' | 'ended' | 'sold'
  viewCount?: number
  watchCount?: number
  // Additional fields
  manufacturer?: string
  countryOfOrigin?: string
  warrantyInfo?: string
  ageGroup?: string
  character?: string
  exclusivity?: string
  features?: string
  funkoPop?: boolean
  isbn?: string
  itemHeight?: string
  itemLength?: string
  itemWidth?: string
  mpn?: string
  releaseDate?: string
  series?: string
  theme?: string
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
  material?: string
  condition?: string
  quantity?: number
  currency?: string
  ageGroup?: string
  character?: string
  exclusivity?: string
  features?: string
  funkoPop?: boolean
  isbn?: string
  itemHeight?: string
  itemLength?: string
  itemWidth?: string
  mpn?: string
  releaseDate?: string
  series?: string
  theme?: string
  aiContent?: {
    seoTitle?: string
    ebayTitle?: string
    shortDescription?: string
    productDescription?: string
  }
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({})
  const [imageGallery, setImageGallery] = useState<{ isOpen: boolean; product: Product | null; currentIndex: number }>({ isOpen: false, product: null, currentIndex: 0 })
  const [detailView, setDetailView] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null })
  
  // eBay Export State
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showEBayExport, setShowEBayExport] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  
  // AI Enhancement State
  const [aiEnhancing, setAiEnhancing] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id)
    setEditForm({
      title: product.title || '',
      description: product.description || '',
      brand: product.brand || '',
      model: product.model || '',
      color: product.color || '',
      size: product.size || '',
      weight: product.weight || '',
      dimensions: product.dimensions || '',
      material: product.material || '',
      condition: product.condition || '',
      quantity: product.quantity,
      currency: product.currency || 'USD',
      ageGroup: product.ageGroup || '',
      character: product.character || '',
      exclusivity: product.exclusivity || '',
      features: product.features || '',
      funkoPop: product.funkoPop || false,
      isbn: product.isbn || '',
      itemHeight: product.itemHeight || '',
      itemLength: product.itemLength || '',
      itemWidth: product.itemWidth || '',
      mpn: product.mpn || '',
      releaseDate: product.releaseDate || '',
      series: product.series || '',
      theme: product.theme || '',
      aiContent: product.aiContent ? {
        seoTitle: product.aiContent.seoTitle || '',
        ebayTitle: product.aiContent.ebayTitle || '',
        shortDescription: product.aiContent.shortDescription || '',
        productDescription: product.aiContent.productDescription || ''
      } : undefined
    })
  }

  const handleSave = async () => {
    if (!editingProduct) return

    // Basic validation
    if (editForm.quantity !== undefined && editForm.quantity < 0) {
      alert('Quantity cannot be negative')
      return
    }

    // Validate AI content fields if they exist
    if (editForm.aiContent) {
      const { seoTitle, ebayTitle, shortDescription, productDescription } = editForm.aiContent
      
      // Check title length limits (eBay has 80 character limit)
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
      const response = await fetch(`/api/products/${editingProduct}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await fetchInventory() // Refresh the data
        setEditingProduct(null)
        setEditForm({})
      } else {
        const errorData = await response.json()
        alert(`Failed to update product: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Error updating product. Please check your connection and try again.')
    }
  }

  const handleCancel = () => {
    setEditingProduct(null)
    setEditForm({})
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.title || product.upc}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchInventory() // Refresh the data
        alert('Product deleted successfully')
      } else {
        const errorData = await response.json()
        alert(`Failed to delete product: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const getProductImage = (product: Product) => {
    const firstImage = product.images?.[0]
    return firstImage?.originalUrl || '/placeholder-product.svg'
  }

  const openImageGallery = (product: Product, index: number = 0) => {
    setImageGallery({ isOpen: true, product, currentIndex: index })
  }

  const closeImageGallery = () => {
    setImageGallery({ isOpen: false, product: null, currentIndex: 0 })
  }

  const nextImage = () => {
    if (!imageGallery.product) return
    const nextIndex = (imageGallery.currentIndex + 1) % imageGallery.product.images.length
    setImageGallery(prev => ({ ...prev, currentIndex: nextIndex }))
  }

  const prevImage = () => {
    if (!imageGallery.product) return
    const prevIndex = imageGallery.currentIndex === 0 ? imageGallery.product.images.length - 1 : imageGallery.currentIndex - 1
    setImageGallery(prev => ({ ...prev, currentIndex: prevIndex }))
  }

  // eBay Export Functions
  const fetchEBayTemplates = async () => {
    try {
      const response = await fetch('/api/ebay/export')
      if (response.ok) {
        const data = await response.json()
        setAvailableTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching eBay templates:', error)
    }
  }

  const handleEBayExport = async (templateType: string) => {
    if (selectedProducts.size === 0) {
      alert('No products selected for export')
      return
    }

    setExportLoading(true)
    try {
      const response = await fetch('/api/ebay/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProducts),
          templateType,
        }),
      })

      if (response.ok) {
        // Download the CSV file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `ebay_listings_${templateType}_${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        // Clear selection and close modal
        setSelectedProducts(new Set())
        setShowEBayExport(false)
        alert(`Successfully exported ${selectedProducts.size} products to eBay CSV format!`)
      } else {
        const errorData = await response.json()
        alert(`Export failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error exporting to eBay:', error)
      alert('Error exporting to eBay. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  const handleAIEnhance = async (product: Product) => {
    if (aiEnhancing.has(product.id)) return

    setAiEnhancing(prev => new Set([...prev, product.id]))

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [product.id],
          regenerate: !!product.aiContent // Regenerate if AI content already exists
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.summary.completed > 0) {
          await fetchInventory() // Refresh the data to show new AI content
        }
        
        const message = result.summary.completed > 0 
          ? 'AI content generated successfully!' 
          : 'AI content generation failed'
        alert(message)
      } else {
        throw new Error('Failed to generate AI content')
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
      alert('Error generating AI content. Please try again.')
    } finally {
      setAiEnhancing(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }
  }

  const getAIStatusIcon = (aiContent?: AIContent) => {
    if (!aiContent) return null
    
    switch (aiContent.status) {
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full" title="AI content completed" />
      case 'processing':
        return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="AI content processing" />
      case 'failed':
        return <div className="w-2 h-2 bg-red-500 rounded-full" title="AI content failed" />
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="AI content pending" />
      default:
        return null
    }
  }

  // Load templates when export modal opens
  useEffect(() => {
    if (showEBayExport && availableTemplates.length === 0) {
      fetchEBayTemplates()
    }
  }, [showEBayExport, availableTemplates.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="p-2 text-gray-400 hover:text-blue-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-gray-600">{products.length} products in inventory</p>
              </div>
            </div>
            <div className="flex space-x-4">
              {selectedProducts.size > 0 && (
                <button
                  onClick={() => setShowEBayExport(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to eBay ({selectedProducts.size})</span>
                </button>
              )}
              <Link
                href="/ai-content"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span>AI Content</span>
              </Link>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>Back to Scanner</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products in inventory</h3>
            <p className="text-gray-600 mb-4">Start scanning products to build your inventory</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Go to Scanner
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-16 gap-3 text-xs font-medium text-gray-600 uppercase tracking-wider">
                <div className="col-span-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.length && products.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(new Set(products.map(p => p.id)))
                      } else {
                        setSelectedProducts(new Set())
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1">Image</div>
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Brand/UPC</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2">Price Range</div>
                <div className="col-span-2">Physical</div>
                <div className="col-span-2">Details</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>
            </div>

            {/* Product Rows */}
            <div className="divide-y divide-gray-200">
              {products.map((product) => (
                <div key={product.id} className="px-6 py-4 hover:bg-gray-50">
                  {editingProduct === product.id ? (
                    /* Edit Form */
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-1">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <img
                              src={getProductImage(product)}
                              alt={product.title || `Product ${product.upc}`}
                              className="max-w-full max-h-full object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                              }}
                            />
                          </div>
                        </div>
                        <div className="col-span-11 space-y-3">
                          <input
                            type="text"
                            placeholder="Product Title"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={editForm.brand || ''}
                              onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="number"
                              placeholder="Quantity"
                              value={editForm.quantity || 0}
                              onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Color"
                              value={editForm.color || ''}
                              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Size"
                              value={editForm.size || ''}
                              onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Weight"
                              value={editForm.weight || ''}
                              onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Dimensions"
                              value={editForm.dimensions || ''}
                              onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Material"
                              value={editForm.material || ''}
                              onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <select
                              value={editForm.condition || ''}
                              onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">Condition</option>
                              <option value="New">New</option>
                              <option value="Used">Used</option>
                              <option value="Refurbished">Refurbished</option>
                              <option value="Damaged">Damaged</option>
                            </select>
                          </div>
                          {/* Funko Pop Specific Fields */}
                          {editForm.funkoPop && (
                            <div className="space-y-3 border-t border-orange-200 pt-4 mt-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <Package className="w-4 h-4 text-orange-600" />
                                <h5 className="text-sm font-medium text-orange-900">Funko Pop Details</h5>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  placeholder="Character"
                                  value={editForm.character || ''}
                                  onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                                  className="px-3 py-2 border border-orange-300 rounded-md text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Series"
                                  value={editForm.series || ''}
                                  onChange={(e) => setEditForm({ ...editForm, series: e.target.value })}
                                  className="px-3 py-2 border border-orange-300 rounded-md text-sm"
                                />
                                <input
                                  type="text"
                                  placeholder="Exclusivity"
                                  value={editForm.exclusivity || ''}
                                  onChange={(e) => setEditForm({ ...editForm, exclusivity: e.target.value })}
                                  className="px-3 py-2 border border-orange-300 rounded-md text-sm"
                                />
                              </div>
                            </div>
                          )}
                          {/* Additional Product Fields */}
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Theme"
                              value={editForm.theme || ''}
                              onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Age Group"
                              value={editForm.ageGroup || ''}
                              onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <input
                              type="text"
                              placeholder="MPN"
                              value={editForm.mpn || ''}
                              onChange={(e) => setEditForm({ ...editForm, mpn: e.target.value })}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={editForm.funkoPop || false}
                                onChange={(e) => setEditForm({ ...editForm, funkoPop: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Funko Pop</span>
                            </label>
                          </div>
                          <textarea
                            placeholder="Description"
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20 resize-none"
                          />
                          
                          {/* AI Content Fields */}
                          {editForm.aiContent !== undefined && (
                            <div className="space-y-3 border-t border-purple-200 pt-4 mt-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <h5 className="text-sm font-medium text-purple-900">AI Generated Content</h5>
                              </div>
                              
                              <input
                                type="text"
                                placeholder="SEO Title"
                                value={editForm.aiContent?.seoTitle || ''}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  aiContent: { ...editForm.aiContent, seoTitle: e.target.value } 
                                })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                              />
                              
                              <input
                                type="text"
                                placeholder="eBay Title"
                                value={editForm.aiContent?.ebayTitle || ''}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  aiContent: { ...editForm.aiContent, ebayTitle: e.target.value } 
                                })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                              />
                              
                              <textarea
                                placeholder="Short Description"
                                value={editForm.aiContent?.shortDescription || ''}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  aiContent: { ...editForm.aiContent, shortDescription: e.target.value } 
                                })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm h-16 resize-none bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                              />
                              
                              <textarea
                                placeholder="Product Description (AI Generated)"
                                value={editForm.aiContent?.productDescription || ''}
                                onChange={(e) => setEditForm({ 
                                  ...editForm, 
                                  aiContent: { ...editForm.aiContent, productDescription: e.target.value } 
                                })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md text-sm h-24 resize-none bg-white text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                              />
                            </div>
                          )}
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSave}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div 
                      className="grid grid-cols-16 gap-3 items-center cursor-pointer hover:bg-gray-100 transition-colors rounded-lg p-2 -m-2" 
                      onClick={() => window.location.href = `/inventory/${product.id}`}
                    >
                      {/* Selection Checkbox */}
                      <div 
                        className="col-span-1 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedProducts)
                            if (e.target.checked) {
                              newSelected.add(product.id)
                            } else {
                              newSelected.delete(product.id)
                            }
                            setSelectedProducts(newSelected)
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Product Image */}
                      <div className="col-span-1">
                        <div 
                          className="relative w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation()
                            openImageGallery(product)
                          }}
                        >
                          <img
                            src={getProductImage(product)}
                            alt={product.title || `Product ${product.upc}`}
                            className="max-w-full max-h-full object-contain rounded group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                            }}
                          />
                          {product.images.length > 1 && (
                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {product.images.length}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="col-span-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 text-sm mb-1 flex-1">
                            {product.title || `UPC: ${product.upc}`}
                          </h3>
                          {getAIStatusIcon(product.aiContent)}
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
                        )}
                        {product.categories.length > 0 && (
                          <p className="text-xs text-purple-600 mt-1">{product.categories[0].category.name}</p>
                        )}
                      </div>

                      {/* Brand/UPC */}
                      <div className="col-span-2">
                        {product.brand && (
                          <p className="text-sm font-medium text-gray-900">{product.brand}</p>
                        )}
                        <p className="text-xs text-gray-500">UPC: {product.upc}</p>
                        {product.model && (
                          <p className="text-xs text-gray-500">Model: {product.model}</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-1 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.quantity}
                        </span>
                      </div>

                      {/* Price Range */}
                      <div className="col-span-2">
                        {product.lowestRecordedPrice || product.highestRecordedPrice ? (
                          <div>
                            {product.lowestRecordedPrice && product.highestRecordedPrice && product.lowestRecordedPrice !== product.highestRecordedPrice ? (
                              <p className="text-sm font-medium text-green-600">
                                ${product.lowestRecordedPrice.toFixed(2)} - ${product.highestRecordedPrice.toFixed(2)}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-green-600">
                                ${(product.lowestRecordedPrice || product.highestRecordedPrice)?.toFixed(2)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">No price data</p>
                        )}
                        {product.offers.length > 0 && (
                          <p className="text-xs text-gray-500">{product.offers.length} offer{product.offers.length !== 1 ? 's' : ''}</p>
                        )}
                      </div>

                      {/* Physical Properties */}
                      <div className="col-span-2">
                        <div className="text-xs text-gray-600 space-y-1">
                          {product.color && <div><span className="font-medium">Color:</span> {product.color}</div>}
                          {product.size && <div><span className="font-medium">Size:</span> {product.size}</div>}
                          {product.weight && <div><span className="font-medium">Weight:</span> {product.weight}</div>}
                          {product.dimensions && <div><span className="font-medium">Dimensions:</span> {product.dimensions}</div>}
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="col-span-2">
                        <div className="text-xs text-gray-600 space-y-1">
                          {product.material && <div><span className="font-medium">Material:</span> {product.material}</div>}
                          {product.condition && <div><span className="font-medium">Condition:</span> {product.condition}</div>}
                          {product.theme && <div><span className="font-medium">Theme:</span> {product.theme}</div>}
                          {product.funkoPop && <div className="text-orange-600 font-medium">🎁 Funko Pop</div>}
                          {product.character && <div><span className="font-medium">Character:</span> {product.character}</div>}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <div className="text-xs text-gray-600 space-y-1">
                          {product.lastScanned && (
                            <div className="text-gray-400">Scanned: {new Date(product.lastScanned).toLocaleDateString()}</div>
                          )}
                          {product.exclusivity && (
                            <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {product.exclusivity}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center flex-wrap gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(product)
                            }}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-gray-200 hover:border-blue-200"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAIEnhance(product)
                            }}
                            disabled={aiEnhancing.has(product.id)}
                            className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors border border-gray-200 hover:border-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={product.aiContent?.status === 'completed' ? 'Regenerate AI content' : 'Generate AI content'}
                          >
                            {aiEnhancing.has(product.id) ? (
                              <div className="w-3.5 h-3.5 border border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(product)
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-gray-200 hover:border-red-200"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Gallery Modal */}
        {imageGallery.isOpen && imageGallery.product && (
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
              {imageGallery.product.images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Navigation - Next */}
              {imageGallery.product.images.length > 1 && (
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
                  src={imageGallery.product.images[imageGallery.currentIndex]?.originalUrl || '/placeholder-product.svg'}
                  alt={`${imageGallery.product.title || 'Product'} - Image ${imageGallery.currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                  }}
                />
              </div>

              {/* Image Counter */}
              {imageGallery.product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                  {imageGallery.currentIndex + 1} of {imageGallery.product.images.length}
                </div>
              )}

              {/* Product Info Overlay */}
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg max-w-sm">
                <h3 className="font-semibold text-sm mb-1">
                  {imageGallery.product.title || `UPC: ${imageGallery.product.upc}`}
                </h3>
                {imageGallery.product.brand && (
                  <p className="text-xs opacity-75">{imageGallery.product.brand}</p>
                )}
              </div>

              {/* Thumbnail Strip */}
              {imageGallery.product.images.length > 1 && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto px-4">
                  {imageGallery.product.images.map((image, index) => (
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

        {/* eBay Export Modal */}
        {showEBayExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Export to eBay</h3>
                    <p className="text-sm text-gray-600">{selectedProducts.size} products selected</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEBayExport(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Select eBay Template</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose the appropriate eBay category template for your products. This will format your export 
                    according to eBay&apos;s bulk listing requirements.
                  </p>
                  
                  {availableTemplates.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-gray-600">Loading templates...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableTemplates.map((template) => (
                        <div key={template.id} className="border border-gray-200 rounded-lg">
                          <button
                            onClick={() => handleEBayExport(template.id)}
                            disabled={exportLoading}
                            className="w-full p-4 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">{template.name}</h5>
                                <p className="text-sm text-gray-600">Category: {template.category}</p>
                                {template.requiredAspects && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Required: {template.requiredAspects.join(', ')}
                                  </p>
                                )}
                              </div>
                              {exportLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              ) : (
                                <Download className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-blue-900">Export Information</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        The exported CSV file will include product details, pricing, images, and AI-generated content 
                        formatted for eBay bulk upload. Make sure to review the data before uploading to eBay.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button
                  onClick={() => setShowEBayExport(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        {detailView.isOpen && detailView.product && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {detailView.product.title || `Product ${detailView.product.upc}`}
                    </h3>
                    <p className="text-sm text-gray-600">Product Details & Information</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailView({ isOpen: false, product: null })}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Images */}
                  <div className="space-y-4">
                    <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={getProductImage(detailView.product)}
                        alt={detailView.product.title || `Product ${detailView.product.upc}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                        }}
                      />
                    </div>
                    {detailView.product.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {detailView.product.images.slice(0, 8).map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => openImageGallery(detailView.product!, index)}
                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                          >
                            <img
                              src={image.originalUrl || '/placeholder-product.svg'}
                              alt={`Product image ${index + 1}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Center Column - Product Info */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Product Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">UPC/EAN</label>
                          <p className="text-sm text-gray-900">{detailView.product.upc}</p>
                          {detailView.product.ean && (
                            <p className="text-xs text-gray-500">EAN: {detailView.product.ean}</p>
                          )}
                        </div>
                        {detailView.product.brand && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Brand</label>
                            <p className="text-sm text-gray-900">{detailView.product.brand}</p>
                          </div>
                        )}
                        {detailView.product.model && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Model</label>
                            <p className="text-sm text-gray-900">{detailView.product.model}</p>
                          </div>
                        )}
                        {detailView.product.description && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Description</label>
                            <p className="text-sm text-gray-900">{detailView.product.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Physical Properties */}
                    {(detailView.product.color || detailView.product.size || detailView.product.weight) && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Physical Properties</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {detailView.product.color && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Color</label>
                              <p className="text-sm text-gray-900">{detailView.product.color}</p>
                            </div>
                          )}
                          {detailView.product.size && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Size</label>
                              <p className="text-sm text-gray-900">{detailView.product.size}</p>
                            </div>
                          )}
                          {detailView.product.weight && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Weight</label>
                              <p className="text-sm text-gray-900">{detailView.product.weight}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inventory Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Inventory</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Quantity</label>
                          <p className="text-lg font-semibold text-blue-600">{detailView.product.quantity}</p>
                        </div>
                        {detailView.product.lastScanned && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Last Scanned</label>
                            <p className="text-sm text-gray-900">
                              {new Date(detailView.product.lastScanned).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    {detailView.product.categories.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Categories</h4>
                        <div className="space-y-2">
                          {detailView.product.categories.map((cat, index) => (
                            <div key={cat.category.id} className="flex items-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {cat.category.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Pricing & AI Content */}
                  <div className="space-y-6">
                    {/* Pricing */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing Information</h4>
                      {detailView.product.lowestRecordedPrice || detailView.product.highestRecordedPrice ? (
                        <div className="space-y-2">
                          {detailView.product.lowestRecordedPrice && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Lowest Price</label>
                              <p className="text-lg font-semibold text-green-600">
                                ${detailView.product.lowestRecordedPrice.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {detailView.product.highestRecordedPrice && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Highest Price</label>
                              <p className="text-lg font-semibold text-green-600">
                                ${detailView.product.highestRecordedPrice.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No pricing data available</p>
                      )}
                    </div>

                    {/* Market Offers */}
                    {detailView.product.offers.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Market Offers ({detailView.product.offers.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {detailView.product.offers.map((offer) => (
                            <div key={offer.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{offer.merchant}</p>
                                  {offer.condition && (
                                    <p className="text-xs text-gray-600">Condition: {offer.condition}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {offer.price && (
                                    <p className="font-semibold text-sm text-green-600">
                                      ${offer.price.toFixed(2)}
                                    </p>
                                  )}
                                  {offer.availability && (
                                    <p className="text-xs text-gray-500">{offer.availability}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Content Status */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">AI Content</h4>
                      {detailView.product.aiContent ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            {getAIStatusIcon(detailView.product.aiContent)}
                            <span className="text-sm font-medium text-gray-700">
                              Status: {detailView.product.aiContent.status}
                            </span>
                          </div>
                          {detailView.product.aiContent.ebayTitle && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">eBay Title</label>
                              <p className="text-sm text-gray-900">{detailView.product.aiContent.ebayTitle}</p>
                            </div>
                          )}
                          {detailView.product.aiContent.shortDescription && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Short Description</label>
                              <p className="text-sm text-gray-900">{detailView.product.aiContent.shortDescription}</p>
                            </div>
                          )}
                          {detailView.product.aiContent.generatedAt && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Generated</label>
                              <p className="text-xs text-gray-500">
                                {new Date(detailView.product.aiContent.generatedAt).toLocaleString()}
                              </p>
                            </div>
                          )}
                          <Link
                            href={`/ai-content?productId=${detailView.product.id}`}
                            className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Bot className="w-4 h-4 mr-2" />
                            View AI Content
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500">No AI content generated yet</p>
                          <button
                            onClick={() => handleAIEnhance(detailView.product!)}
                            disabled={aiEnhancing.has(detailView.product!.id)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {aiEnhancing.has(detailView.product!.id) ? (
                              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <Sparkles className="w-4 h-4 mr-2" />
                            )}
                            Generate AI Content
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setDetailView({ isOpen: false, product: null })
                      handleEdit(detailView.product!)
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => openImageGallery(detailView.product!)}
                    className="inline-flex items-center px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Images
                  </button>
                </div>
                <button
                  onClick={() => setDetailView({ isOpen: false, product: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </MainLayout>
  )
}
