'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ImageManager from '@/components/ImageManager'
import ListingPreview from '@/components/ListingPreview'
import ValidationDisplay from '@/components/ValidationDisplay'
import { ArrowLeft, Save, Send, Trash2, Package, Edit3, DollarSign, FileText } from 'lucide-react'

interface Draft {
  id: string
  productId: string
  title: string
  description: string
  price: number
  platform: string
  notes: string
  createdAt: string
  updatedAt: string
  product: {
    id: string
    title: string
    upc: string
    brand?: string
    model?: string
    color?: string
    size?: string
    condition?: string
    lowestRecordedPrice?: number
    highestRecordedPrice?: number
    quantity: number
    images: Array<{ 
      id: string
      originalUrl?: string 
      url?: string
      altText?: string
      isPrimary: boolean
    }>
  } | null
}

export default function DraftDetailPage() {
  const router = useRouter()
  const params = useParams()
  const draftId = params.id as string

  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [images, setImages] = useState<Array<{ 
    id: string
    originalUrl?: string 
    url?: string
    altText?: string
    isPrimary: boolean
    imageNumber?: number
  }>>([])
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    notes: '',
    // Product fields
    brand: '',
    model: '',
    color: '',
    size: '',
    condition: '',
    upc: '',
    quantity: 1,
    // eBay specific
    ebayCategory: '',
    listingFormat: 'FixedPrice', // FixedPrice, Auction, StoreInventory
    duration: '7', // 1, 3, 5, 7, 10, 30 days
    startPrice: 0,
    buyItNowPrice: 0,
    acceptBestOffer: false
  })

  useEffect(() => {
    if (draftId) {
      fetchDraft()
    }
  }, [draftId])

  const fetchDraft = async () => {
    try {
      const response = await fetch(`/api/listings/drafts/${draftId}`)
      if (response.ok) {
        const draftData = await response.json()
        setDraft(draftData)
        setImages(draftData.product?.images || [])
        setFormData({
          title: draftData.title || draftData.product?.title || '',
          description: draftData.description || draftData.product?.description || '',
          price: draftData.price || 0,
          notes: draftData.notes || '',
          // Product fields
          brand: draftData.product?.brand || '',
          model: draftData.product?.model || '',
          color: draftData.product?.color || '',
          size: draftData.product?.size || '',
          condition: draftData.product?.condition || 'New',
          upc: draftData.product?.upc || '',
          quantity: draftData.product?.quantity || 1,
          // eBay specific - these would come from draft platform settings
          ebayCategory: draftData.ebayCategory || '',
          listingFormat: draftData.listingFormat || 'FixedPrice',
          duration: draftData.duration || '7',
          startPrice: draftData.startPrice || 0,
          buyItNowPrice: draftData.buyItNowPrice || draftData.price || 0,
          acceptBestOffer: draftData.acceptBestOffer || false
        })
      } else {
        console.error('Failed to fetch draft')
        router.push('/listings')
      }
    } catch (error) {
      console.error('Error fetching draft:', error)
      router.push('/listings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleImagesChange = (updatedImages: Array<{ 
    id: string
    originalUrl?: string 
    url?: string
    altText?: string
    isPrimary: boolean
    imageNumber?: number
  }>) => {
    setImages(updatedImages)
    setHasUnsavedChanges(true)
  }

  const handleGenerateTemplate = async () => {
    if (!draft?.product?.id) return
    
    setGeneratingTemplate(true)
    try {
      const response = await fetch('/api/optimizer/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: draft.product.id,
          includeMarketData: true
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.html) {
        setGeneratedTemplate(result.html)
        // Optionally update description with generated content
        if (result.optimizedContent?.optimizedDescription) {
          setFormData(prev => ({
            ...prev,
            description: result.optimizedContent.optimizedDescription
          }))
          setHasUnsavedChanges(true)
        }
        alert('✅ Professional HTML template generated successfully!')
      } else {
        console.error('Template generation failed:', result.error)
        alert(`❌ Template generation failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating template:', error)
      alert('❌ Error generating template. Please try again.')
    } finally {
      setGeneratingTemplate(false)
    }
  }

  const handleUseTemplate = () => {
    if (generatedTemplate) {
      setFormData(prev => ({ ...prev, description: generatedTemplate }))
      setHasUnsavedChanges(true)
      alert('✅ Template applied to description!')
    }
  }

  const handlePreviewTemplate = () => {
    if (generatedTemplate) {
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(generatedTemplate)
        newWindow.document.title = 'Generated Template Preview'
      }
    }
  }

  const handleSave = async () => {
    if (!draft || saving) return

    setSaving(true)
    try {
      // Update draft fields
      const draftResponse = await fetch(`/api/listings/drafts/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          notes: formData.notes
        })
      })

      // Update product fields if product exists
      if (draft.product) {
        const productResponse = await fetch(`/api/products/${draft.product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand: formData.brand,
            model: formData.model,
            color: formData.color,
            size: formData.size,
            condition: formData.condition,
            upc: formData.upc,
            quantity: formData.quantity
          })
        })

        if (!productResponse.ok) {
          console.error('Failed to save product changes')
        }
      }

      if (draftResponse.ok) {
        const updatedDraft = await draftResponse.json()
        setDraft(updatedDraft)
        setHasUnsavedChanges(false)
        // Refresh the page to get updated product data
        await fetchDraft()
      } else {
        console.error('Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!draft || !confirm('Are you sure you want to delete this draft?')) return

    try {
      const response = await fetch(`/api/listings/drafts/${draft.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/listings')
      } else {
        console.error('Failed to delete draft')
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fetching draft details
            </p>
          </div>
          
          <div className="text-center text-muted-foreground">Loading draft...</div>
        </div>
      </MainLayout>
    )
  }

  if (!draft) {
    return (
      <MainLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Draft Not Found</h1>
            <p className="text-sm text-muted-foreground mt-1">
              The draft you're looking for doesn't exist
            </p>
          </div>
          
          <div className="text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Draft not found</p>
            <Button onClick={() => router.push('/listings')}>
              Back to Listings
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      actions={
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/listings')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTemplate}
            disabled={generatingTemplate || !draft?.product?.id}
          >
            🤖 {generatingTemplate ? 'Generating...' : 'Template'}
          </Button>
          <Button 
            variant={hasUnsavedChanges ? "primary" : "outline"}
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" size="sm">
            <Send className="w-4 h-4 mr-2" />
            Publish
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Edit3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Draft Details</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Edit listing draft
              </p>
            </div>
          </div>
        </div>
        
        {/* Product Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {draft.title || draft.product?.title || 'Untitled Draft'}
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              draft.platform === 'EBAY' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              draft.platform === 'AMAZON' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {draft.platform} Draft
            </span>
            <span>Created {new Date(draft.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Image Manager */}
                <ImageManager
                  images={images}
                  productId={draft.product?.id}
                  onImagesChange={handleImagesChange}
                  maxImages={10}
                />

                {/* Product Details - Now Editable */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">UPC</label>
                    <input
                      type="text"
                      value={formData.upc}
                      onChange={(e) => handleInputChange('upc', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter UPC"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Brand</label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter brand"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter model"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Color</label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => handleInputChange('color', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Enter color"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Size</label>
                      <input
                        type="text"
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Enter size"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Acceptable">Acceptable</option>
                      <option value="Used">Used</option>
                      <option value="For Parts">For Parts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Inventory Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter quantity"
                    />
                  </div>

                  {(draft.product?.lowestRecordedPrice || draft.product?.highestRecordedPrice) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Historical Price Range</label>
                      <p className="text-foreground mt-1">
                        ${draft.product?.lowestRecordedPrice?.toFixed(2) || 'N/A'} - 
                        ${draft.product?.highestRecordedPrice?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Validation Display */}
            <ValidationDisplay
              platform={draft.platform || 'EBAY'}
              draftData={{
                title: formData.title,
                description: formData.description,
                price: formData.price,
                brand: formData.brand,
                condition: formData.condition,
                ebayCategory: formData.ebayCategory,
                quantity: formData.quantity,
                images: images,
                listingFormat: formData.listingFormat,
                startPrice: formData.startPrice,
                buyItNowPrice: formData.buyItNowPrice,
                acceptBestOffer: formData.acceptBestOffer
              }}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Draft Editing Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit3 className="w-5 h-5 mr-2" />
                  Draft Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter listing title"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      Description
                    </label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateTemplate}
                        disabled={generatingTemplate || !draft?.product?.id}
                      >
                        {generatingTemplate ? 'Generating...' : '🤖 Generate HTML Template'}
                      </Button>
                      {generatedTemplate && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviewTemplate}
                          >
                            👁️ Preview
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUseTemplate}
                          >
                            ✅ Use Template
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter product description or click 'Generate HTML Template' for professional content"
                  />
                  {generatedTemplate && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✅</span>
                        <span className="text-sm text-green-700 font-medium">
                          Professional HTML template generated! Preview it or click "Use Template" to apply.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Internal notes (not visible to buyers)"
                  />
                </div>

                {/* Platform Info */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Target Platform
                  </label>
                  <p className="text-foreground bg-muted px-3 py-2 rounded-lg">
                    {draft.platform}
                  </p>
                </div>

                {/* eBay-Specific Settings */}
                {draft.platform === 'EBAY' && (
                  <div className="space-y-4 border-t border-border pt-6">
                    <h4 className="text-md font-medium text-foreground">eBay Listing Settings</h4>
                    
                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        eBay Category
                      </label>
                      <select
                        value={formData.ebayCategory}
                        onChange={(e) => handleInputChange('ebayCategory', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Select a category...</option>
                        <option value="11450">Collectibles › Trading Cards › Sports Trading Cards</option>
                        <option value="220">Toys & Hobbies › Action Figures</option>
                        <option value="2618">Toys & Hobbies › Classic Toys</option>
                        <option value="1305">Toys & Hobbies › Diecast & Toy Vehicles</option>
                        <option value="19107">Toys & Hobbies › Electronic, Battery & Wind-Up</option>
                        <option value="246">Toys & Hobbies › Games</option>
                        <option value="2550">Entertainment › Pop Culture</option>
                        <option value="64482">Books › Children's Books</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose the most specific category for better visibility
                      </p>
                    </div>

                    {/* Listing Format */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Listing Format
                      </label>
                      <select
                        value={formData.listingFormat}
                        onChange={(e) => handleInputChange('listingFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="FixedPrice">Buy It Now (Fixed Price)</option>
                        <option value="Auction">Auction</option>
                        <option value="StoreInventory">Store Inventory</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Listing Duration
                      </label>
                      <select
                        value={formData.duration}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="1">1 Day</option>
                        <option value="3">3 Days</option>
                        <option value="5">5 Days</option>
                        <option value="7">7 Days</option>
                        <option value="10">10 Days</option>
                        <option value="30">30 Days (Good 'Til Cancelled)</option>
                      </select>
                    </div>

                    {/* Auction Settings */}
                    {formData.listingFormat === 'Auction' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Starting Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.startPrice}
                            onChange={(e) => handleInputChange('startPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="0.99"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Buy It Now Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.buyItNowPrice}
                            onChange={(e) => handleInputChange('buyItNowPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    )}

                    {/* Best Offer */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="acceptBestOffer"
                        checked={formData.acceptBestOffer}
                        onChange={(e) => handleInputChange('acceptBestOffer', e.target.checked)}
                        className="rounded border-input"
                      />
                      <label htmlFor="acceptBestOffer" className="text-sm font-medium text-foreground">
                        Accept Best Offers
                      </label>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-foreground">{new Date(draft.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Updated</label>
                    <p className="text-foreground">{new Date(draft.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Listing Preview */}
            <ListingPreview
              data={{
                title: formData.title,
                description: formData.description,
                price: formData.price,
                platform: draft.platform || 'EBAY',
                brand: formData.brand,
                condition: formData.condition,
                images: images,
                ebayCategory: formData.ebayCategory,
                listingFormat: formData.listingFormat,
                duration: formData.duration,
                quantity: formData.quantity
              }}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}