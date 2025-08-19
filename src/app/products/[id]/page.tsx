'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  Package, Save, Trash2, Plus, X, Image, 
  DollarSign, Truck, Tag, Info, AlertCircle,
  ChevronDown, ChevronUp, Sparkles, Upload,
  Edit3, Check, BarChart, Send, GripVertical
} from 'lucide-react'

interface Product {
  id: string
  upc: string
  ean?: string
  sku?: string
  title: string
  description?: string
  brand?: string
  model?: string
  mpn?: string
  
  // Physical attributes
  color?: string
  size?: string
  weight?: number
  weightUnit?: string
  dimensions?: any
  material?: string
  
  // Categories & Classification
  condition: string
  categories?: Array<{ category: { fullPath?: string } }>
  
  // Pricing
  quantity: number
  lowestRecordedPrice?: number
  highestRecordedPrice?: number
  
  // Additional eBay fields
  features?: string
  theme?: string
  character?: string
  series?: string
  ageGroup?: string
  
  // Images
  images?: Array<{ id: string; originalUrl?: string; imageNumber: number }>
  
  // AI Content
  aiContent?: {
    ebayTitle?: string
    productDescription?: string
    bulletPoints?: string
    itemSpecifics?: string
  }
}

// eBay Item Specifics that are common across categories
const COMMON_ITEM_SPECIFICS = [
  { name: 'Brand', required: true },
  { name: 'MPN', required: false },
  { name: 'UPC', required: true },
  { name: 'Condition', required: true },
  { name: 'Type', required: false },
  { name: 'Material', required: false },
  { name: 'Color', required: false },
  { name: 'Size', required: false },
  { name: 'Model', required: false },
  { name: 'Features', required: false },
  { name: 'Country/Region of Manufacture', required: false },
  { name: 'Item Height', required: false },
  { name: 'Item Length', required: false },
  { name: 'Item Width', required: false },
  { name: 'Item Weight', required: false },
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({})
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    basic: true,
    pricing: true,
    physical: true,
    itemSpecifics: true,
    images: true,
    description: true,
  })
  const [itemSpecifics, setItemSpecifics] = useState<{ [key: string]: string }>({})
  const [customSpecifics, setCustomSpecifics] = useState<Array<{ name: string; value: string }>>([])
  const [draggingImage, setDraggingImage] = useState<number | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        
        // Initialize item specifics from product data
        setItemSpecifics({
          Brand: data.brand || '',
          MPN: data.mpn || '',
          UPC: data.upc || '',
          Condition: data.condition || 'New',
          Type: data.type || '',
          Material: data.material || '',
          Color: data.color || '',
          Size: data.size || '',
          Model: data.model || '',
          Features: data.features || '',
        })
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    if (product) {
      setProduct({ ...product, [field]: value })
    }
  }

  const handleItemSpecificChange = (name: string, value: string) => {
    setItemSpecifics(prev => ({ ...prev, [name]: value }))
  }

  const addCustomSpecific = () => {
    setCustomSpecifics([...customSpecifics, { name: '', value: '' }])
  }

  const removeCustomSpecific = (index: number) => {
    setCustomSpecifics(customSpecifics.filter((_, i) => i !== index))
  }

  const updateCustomSpecific = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customSpecifics]
    updated[index][field] = value
    setCustomSpecifics(updated)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const saveProduct = async () => {
    if (!product) return
    setSaving(true)
    
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          itemSpecifics: { ...itemSpecifics, custom: customSpecifics }
        })
      })
      
      if (response.ok) {
        // Show success toast
        console.log('Product saved successfully')
      }
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setSaving(false)
    }
  }

  const generateAIContent = async () => {
    if (!product) return
    setAiGenerating(true)
    
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          brand: product.brand,
          condition: product.condition,
          category: product.categories?.[0]?.category?.fullPath || '',
          features: product.features,
          currentDescription: product.description
        })
      })
      
      if (response.ok) {
        const aiContent = await response.json()
        
        // Update product with AI-generated content
        setProduct({
          ...product,
          title: aiContent.optimizedTitle || product.title,
          description: aiContent.description || product.description,
          aiContent: {
            ebayTitle: aiContent.ebayTitle,
            productDescription: aiContent.description,
            bulletPoints: aiContent.bulletPoints,
            itemSpecifics: aiContent.itemSpecifics
          }
        })
        
        // Auto-populate item specifics if provided
        if (aiContent.itemSpecifics) {
          setItemSpecifics(prev => ({
            ...prev,
            ...aiContent.itemSpecifics
          }))
        }
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
    } finally {
      setAiGenerating(false)
    }
  }

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggingImage(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggingImage === null || !product?.images) return

    const draggedImage = product.images[draggingImage]
    const newImages = [...product.images]
    
    // Remove dragged image from its original position
    newImages.splice(draggingImage, 1)
    
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage)
    
    // Update image numbers
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      imageNumber: idx + 1
    }))
    
    setProduct({ ...product, images: reorderedImages })
    setDraggingImage(null)
  }

  const removeImage = async (imageId: string) => {
    if (!product?.images) return
    
    const newImages = product.images
      .filter(img => img.id !== imageId)
      .map((img, idx) => ({ ...img, imageNumber: idx + 1 }))
    
    setProduct({ ...product, images: newImages })
  }

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return (
      <MainLayout title="Product Not Found">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      title={product.title || "Product Details"}
      subtitle={`UPC: ${product.upc}`}
      icon={<Package className="w-8 h-8 text-primary" />}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/inventory')}>
            Back to Inventory
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={generateAIContent}
            loading={aiGenerating}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {aiGenerating ? 'Optimizing...' : 'AI Optimize All Fields'}
          </Button>
          <Button variant="primary" size="sm" onClick={saveProduct} loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Product Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Information */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                  {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CardHeader>
              {expandedSections.basic && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Product Title *"
                      value={product.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                    />
                    <Input
                      label="Brand *"
                      value={product.brand || ''}
                      onChange={(e) => handleFieldChange('brand', e.target.value)}
                    />
                    <Input
                      label="SKU"
                      value={product.sku || ''}
                      onChange={(e) => handleFieldChange('sku', e.target.value)}
                    />
                    <Input
                      label="MPN (Manufacturer Part Number)"
                      value={product.mpn || ''}
                      onChange={(e) => handleFieldChange('mpn', e.target.value)}
                    />
                    <Input
                      label="Model"
                      value={product.model || ''}
                      onChange={(e) => handleFieldChange('model', e.target.value)}
                    />
                    <select
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={product.condition}
                      onChange={(e) => handleFieldChange('condition', e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="New other">New other (see details)</option>
                      <option value="New with defects">New with defects</option>
                      <option value="Manufacturer refurbished">Manufacturer refurbished</option>
                      <option value="Seller refurbished">Seller refurbished</option>
                      <option value="Used">Used</option>
                      <option value="Very Good">Very Good</option>
                      <option value="Good">Good</option>
                      <option value="Acceptable">Acceptable</option>
                      <option value="For parts or not working">For parts or not working</option>
                    </select>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Description & Keywords - Moved up for better flow */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('description')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Edit3 className="w-5 h-5 mr-2" />
                    Description & Keywords
                  </CardTitle>
                  {expandedSections.description ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CardHeader>
              {expandedSections.description && (
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Product Description</label>
                    <textarea
                      className="w-full h-32 p-3 rounded-lg border border-input bg-background text-sm"
                      value={product.description || ''}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="Enter a detailed product description for your listings..."
                    />
                  </div>
                  
                  {product.aiContent?.bulletPoints && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        AI Generated Bullet Points
                      </h4>
                      <p className="text-sm whitespace-pre-line">{product.aiContent.bulletPoints}</p>
                    </div>
                  )}

                  {product.aiContent?.ebayTitle && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        AI Optimized eBay Title
                      </h4>
                      <p className="text-sm">{product.aiContent.ebayTitle}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Keywords / Tags</label>
                    <Input
                      value={product.features || ''}
                      onChange={(e) => handleFieldChange('features', e.target.value)}
                      placeholder="Enter keywords separated by commas (e.g., vintage, collectible, rare)"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Pricing & Inventory */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('pricing')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing & Inventory
                  </CardTitle>
                  {expandedSections.pricing ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CardHeader>
              {expandedSections.pricing && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Quantity in Stock"
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleFieldChange('quantity', parseInt(e.target.value))}
                    />
                    <Input
                      label="Your Price"
                      type="number"
                      step="0.01"
                      value={product.lowestRecordedPrice || ''}
                      onChange={(e) => handleFieldChange('lowestRecordedPrice', parseFloat(e.target.value))}
                    />
                    <Input
                      label="MSRP / Compare At"
                      type="number"
                      step="0.01"
                      value={product.highestRecordedPrice || ''}
                      onChange={(e) => handleFieldChange('highestRecordedPrice', parseFloat(e.target.value))}
                    />
                  </div>
                  {product.lowestRecordedPrice && product.highestRecordedPrice && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Price Range: ${product.lowestRecordedPrice?.toFixed(2)} - ${product.highestRecordedPrice?.toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Physical Attributes */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('physical')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Physical Attributes
                  </CardTitle>
                  {expandedSections.physical ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CardHeader>
              {expandedSections.physical && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Color"
                      value={product.color || ''}
                      onChange={(e) => handleFieldChange('color', e.target.value)}
                    />
                    <Input
                      label="Size"
                      value={product.size || ''}
                      onChange={(e) => handleFieldChange('size', e.target.value)}
                    />
                    <Input
                      label="Material"
                      value={product.material || ''}
                      onChange={(e) => handleFieldChange('material', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      label="Weight"
                      type="number"
                      step="0.01"
                      value={product.weight || ''}
                      onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value))}
                    />
                    <Input
                      label="Length (inches)"
                      type="number"
                      step="0.1"
                      value={product.dimensions?.length || ''}
                      onChange={(e) => handleFieldChange('dimensions', { ...product.dimensions, length: parseFloat(e.target.value) })}
                    />
                    <Input
                      label="Width (inches)"
                      type="number"
                      step="0.1"
                      value={product.dimensions?.width || ''}
                      onChange={(e) => handleFieldChange('dimensions', { ...product.dimensions, width: parseFloat(e.target.value) })}
                    />
                    <Input
                      label="Height (inches)"
                      type="number"
                      step="0.1"
                      value={product.dimensions?.height || ''}
                      onChange={(e) => handleFieldChange('dimensions', { ...product.dimensions, height: parseFloat(e.target.value) })}
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* eBay Item Specifics */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('itemSpecifics')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    eBay Item Specifics
                  </CardTitle>
                  {expandedSections.itemSpecifics ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CardHeader>
              {expandedSections.itemSpecifics && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {COMMON_ITEM_SPECIFICS.map(spec => (
                      <div key={spec.name}>
                        <label className="block text-sm font-medium mb-1">
                          {spec.name} {spec.required && <span className="text-destructive">*</span>}
                        </label>
                        <input
                          type="text"
                          value={itemSpecifics[spec.name] || ''}
                          onChange={(e) => handleItemSpecificChange(spec.name, e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Custom Item Specifics */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Custom Item Specifics</h4>
                      <Button variant="outline" size="sm" onClick={addCustomSpecific}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Custom
                      </Button>
                    </div>
                    {customSpecifics.map((spec, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Name"
                          value={spec.name}
                          onChange={(e) => updateCustomSpecific(index, 'name', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={spec.value}
                          onChange={(e) => updateCustomSpecific(index, 'value', e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => removeCustomSpecific(index)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Column - Images & Quick Actions */}
          <div className="space-y-6">
            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag images to reorder. First image will be the main listing photo.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {product.images
                          .sort((a, b) => a.imageNumber - b.imageNumber)
                          .map((img, index) => (
                          <div 
                            key={img.id} 
                            className={`relative group cursor-move ${
                              draggingImage === index ? 'opacity-50' : ''
                            }`}
                            draggable
                            onDragStart={(e) => handleImageDragStart(e, index)}
                            onDragOver={handleImageDragOver}
                            onDrop={(e) => handleImageDrop(e, index)}
                          >
                            <div className="absolute top-1 left-1 z-10">
                              <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                            </div>
                            {index === 0 && (
                              <div className="absolute top-1 left-8 z-10 bg-primary text-white text-xs px-2 py-1 rounded">
                                Main
                              </div>
                            )}
                            <img
                              src={img.originalUrl || '/placeholder.png'}
                              alt={`Product ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-border"
                            />
                            <button 
                              onClick={() => removeImage(img.id)}
                              className="absolute top-1 right-1 p-1 bg-destructive text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              #{index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 h-32 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No images</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </Button>
                  {product.images && product.images.length > 0 && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={saveProduct}
                      title="Save image order"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Send className="w-4 h-4 mr-2" />
                  Create eBay Draft
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart className="w-4 h-4 mr-2" />
                  View Price History
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </Button>
              </CardContent>
            </Card>

            {/* Product Identifiers */}
            <Card>
              <CardHeader>
                <CardTitle>Product Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UPC:</span>
                  <span className="font-mono">{product.upc}</span>
                </div>
                {product.ean && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">EAN:</span>
                    <span className="font-mono">{product.ean}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-mono">{product.sku}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
