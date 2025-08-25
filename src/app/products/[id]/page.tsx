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
  Edit3, Check, BarChart, Send, GripVertical, Video,
  TrendingUp, ExternalLink, ShoppingCart, RefreshCw, Settings,
  Star, StarOff, Download, Bookmark, BookmarkPlus
} from 'lucide-react'
import { 
  detectEbayCategory, 
  getCategorySpec, 
  getAllCategories,
  validateItemSpecifics,
  type EbayCategorySpec,
  type EbayItemSpecific
} from '@/lib/ebay-categories'
import {
  getCategoryTemplates,
  getDefaultTemplate,
  saveTemplate,
  applyTemplate,
  generateSmartDefaults,
  type CategoryTemplate
} from '@/lib/templates'

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
  
  // Offers from retailers
  offers?: Array<{
    id: string
    merchant: string
    price?: number
    listPrice?: number
    currency: string
    condition?: string
    availability?: string
    link?: string
  }>
  
  // Additional eBay fields
  features?: string
  theme?: string
  character?: string
  series?: string
  ageGroup?: string
  
  // Images
  images?: Array<{ id: string; originalUrl?: string; imageNumber: number }>
  videos?: Array<{ id: string; url?: string; thumbnail?: string; duration?: number }>
  
  // AI Content
  aiContent?: {
    ebayTitle?: string
    productDescription?: string
    bulletPoints?: string
    itemSpecifics?: string
    seoKeywords?: string
    tags?: string[]
  }
}



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
  const [selectedCategory, setSelectedCategory] = useState<string>('general')
  const [categorySpec, setCategorySpec] = useState<EbayCategorySpec>(getCategorySpec('general'))
  const [variants, setVariants] = useState<Array<{name: string, options: string[]}>>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [templates, setTemplates] = useState<CategoryTemplate[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false)
  const [draggingImage, setDraggingImage] = useState<number | null>(null)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [marketData, setMarketData] = useState<any>(null)
  const [fetchingMarketData, setFetchingMarketData] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [fetchingImages, setFetchingImages] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  // Detect and update category when product data changes
  useEffect(() => {
    if (product) {
      const detectedCategory = detectEbayCategory(product)
      setSelectedCategory(detectedCategory)
      setCategorySpec(getCategorySpec(detectedCategory))
      
      // Initialize variants if category supports them
      const spec = getCategorySpec(detectedCategory)
      if (spec.supportsVariants && spec.variants) {
        setVariants(spec.variants.map(v => ({ name: v.name, options: [] })))
      } else {
        setVariants([])
      }
    }
  }, [product])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        
        // Detect eBay category automatically
        const detectedCategory = detectEbayCategory(data)
        setSelectedCategory(detectedCategory)
        const spec = getCategorySpec(detectedCategory)
        setCategorySpec(spec)
        
        // Initialize item specifics from product data and category requirements
        const initialSpecifics: { [key: string]: string } = {}
        
        // Set values from product data for matching fields
        spec.itemSpecifics.forEach(specItem => {
          switch (specItem.name) {
            case 'Brand':
              initialSpecifics[specItem.name] = data.brand || ''
              break
            case 'UPC':
              initialSpecifics[specItem.name] = data.upc || ''
              break
            case 'MPN':
              initialSpecifics[specItem.name] = data.mpn || ''
              break
            case 'Condition':
              initialSpecifics[specItem.name] = data.condition || 'New'
              break
            case 'Color':
              initialSpecifics[specItem.name] = data.color || ''
              break
            case 'Size':
              initialSpecifics[specItem.name] = data.size || ''
              break
            case 'Material':
              initialSpecifics[specItem.name] = data.material || ''
              break
            case 'Type':
              initialSpecifics[specItem.name] = data.type || ''
              break
            case 'Model':
              initialSpecifics[specItem.name] = data.model || ''
              break
            case 'Features':
              initialSpecifics[specItem.name] = data.features || ''
              break
            case 'Character':
              initialSpecifics[specItem.name] = data.character || ''
              break
            case 'Series':
              initialSpecifics[specItem.name] = data.series || ''
              break
            case 'Theme':
              initialSpecifics[specItem.name] = data.theme || ''
              break
            case 'Age Level':
              initialSpecifics[specItem.name] = data.ageGroup || ''
              break
            default:
              initialSpecifics[specItem.name] = ''
          }
        })
        
        setItemSpecifics(initialSpecifics)
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
      setHasUnsavedChanges(true)
    }
  }

  const handleItemSpecificChange = (name: string, value: string) => {
    setItemSpecifics(prev => ({ ...prev, [name]: value }))
    setHasUnsavedChanges(true)
  }

  const addCustomSpecific = () => {
    setCustomSpecifics([...customSpecifics, { name: '', value: '' }])
    setHasUnsavedChanges(true)
  }

  const removeCustomSpecific = (index: number) => {
    setCustomSpecifics(customSpecifics.filter((_, i) => i !== index))
    setHasUnsavedChanges(true)
  }

  const updateCustomSpecific = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...customSpecifics]
    updated[index][field] = value
    setCustomSpecifics(updated)
    setHasUnsavedChanges(true)
  }

  const handleCategoryChange = (categoryKey: string) => {
    setSelectedCategory(categoryKey)
    const spec = getCategorySpec(categoryKey)
    setCategorySpec(spec)
    
    // Reset item specifics for new category
    const newSpecifics: { [key: string]: string } = {}
    spec.itemSpecifics.forEach(specItem => {
      // Try to preserve existing values for common fields
      newSpecifics[specItem.name] = itemSpecifics[specItem.name] || ''
    })
    setItemSpecifics(newSpecifics)
    
    // Update variants if supported
    if (spec.supportsVariants && spec.variants) {
      setVariants(spec.variants.map(v => ({ name: v.name, options: [] })))
    } else {
      setVariants([])
    }
    
    // Clear validation errors
    setValidationErrors([])
  }

  const validateCurrentCategory = () => {
    const validation = validateItemSpecifics(selectedCategory, itemSpecifics)
    setValidationErrors(validation.errors)
    return validation.isValid
  }

  const addVariantOption = (variantName: string, option: string) => {
    setVariants(prev => prev.map(v => 
      v.name === variantName 
        ? { ...v, options: [...v.options, option] }
        : v
    ))
  }

  const removeVariantOption = (variantName: string, optionIndex: number) => {
    setVariants(prev => prev.map(v => 
      v.name === variantName 
        ? { ...v, options: v.options.filter((_, i) => i !== optionIndex) }
        : v
    ))
  }

  // Template Management Functions
  const loadTemplates = async () => {
    if (!selectedCategory) return
    setLoadingTemplates(true)
    
    try {
      const response = await fetch(`/api/templates?categoryKey=${selectedCategory}&action=templates&userId=default-user`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const applyTemplateToProduct = async (template: CategoryTemplate) => {
    const newSpecifics = applyTemplate(template, itemSpecifics)
    setItemSpecifics(newSpecifics)
    setShowTemplateModal(false)
  }

  const saveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-template',
          categoryKey: selectedCategory,
          templateName: newTemplateName,
          itemSpecifics,
          userId: 'default-user'
        })
      })

      if (response.ok) {
        setNewTemplateName('')
        setShowSaveTemplateForm(false)
        loadTemplates() // Refresh templates
        alert('Template saved successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error saving template: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Error saving template')
    }
  }

  const setFieldAsDefault = async (fieldName: string, value: string) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-preference',
          categoryKey: selectedCategory,
          fieldName,
          defaultValue: value,
          userId: 'default-user'
        })
      })

      if (response.ok) {
        alert(`${fieldName} set as default for ${categorySpec.categoryName}`)
      }
    } catch (error) {
      console.error('Error setting default:', error)
    }
  }

  const loadSmartDefaults = async () => {
    try {
      const response = await fetch(`/api/templates?categoryKey=${selectedCategory}&action=smart-defaults&userId=default-user`)
      if (response.ok) {
        const data = await response.json()
        const newSpecifics = { ...itemSpecifics }
        
        // Only fill empty fields with defaults
        Object.entries(data.defaults).forEach(([key, value]) => {
          if (!newSpecifics[key] || newSpecifics[key].trim() === '') {
            newSpecifics[key] = value as string
          }
        })
        
        setItemSpecifics(newSpecifics)
      }
    } catch (error) {
      console.error('Error loading smart defaults:', error)
    }
  }

  // Load templates when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'general') {
      loadTemplates()
      loadSmartDefaults()
    }
  }, [selectedCategory])

  // Reset unsaved changes flag when product is loaded
  useEffect(() => {
    if (product) {
      setHasUnsavedChanges(false)
    }
  }, [product?.id])

  // Add keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveProduct()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [product, itemSpecifics, customSpecifics])

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
        setHasUnsavedChanges(false)
        // Show success feedback with a brief highlight
        const successMsg = document.createElement('div')
        successMsg.innerHTML = '✅ Product saved successfully!'
        successMsg.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
        document.body.appendChild(successMsg)
        setTimeout(() => document.body.removeChild(successMsg), 3000)
      } else {
        throw new Error('Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      // Show error feedback
      const errorMsg = document.createElement('div')
      errorMsg.innerHTML = '❌ Failed to save product. Please try again.'
      errorMsg.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
      document.body.appendChild(errorMsg)
      setTimeout(() => document.body.removeChild(errorMsg), 4000)
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
          category: categorySpec.categoryName,
          features: product.features,
          currentDescription: product.description,
          productData: {
            ...product,
            selectedCategory,
            categorySpec: categorySpec.categoryName
          }
        })
      })
      
      if (response.ok) {
        const aiContent = await response.json()
        
        // Update product with AI-generated content
        setProduct({
          ...product,
          title: aiContent.optimizedTitle || product.title,
          description: aiContent.description || product.description,
          features: aiContent.seoKeywords || product.features, // Update features with SEO keywords
          aiContent: {
            ebayTitle: aiContent.ebayTitle,
            productDescription: aiContent.description,
            bulletPoints: aiContent.bulletPoints,
            itemSpecifics: typeof aiContent.itemSpecifics === 'string' 
              ? aiContent.itemSpecifics 
              : JSON.stringify(aiContent.itemSpecifics),
            seoKeywords: aiContent.seoKeywords,
            tags: aiContent.tags
          }
        })
        
        // Auto-populate item specifics if provided
        if (aiContent.itemSpecifics) {
          const newSpecifics = typeof aiContent.itemSpecifics === 'string' 
            ? JSON.parse(aiContent.itemSpecifics)
            : aiContent.itemSpecifics
          setItemSpecifics(prev => ({
            ...prev,
            ...newSpecifics
          }))
        }
        
        // Update category if AI detected a different one
        if (aiContent.categoryInfo && aiContent.categoryInfo.detectedCategory !== selectedCategory) {
          console.log('AI detected different category:', aiContent.categoryInfo.detectedCategory)
          handleCategoryChange(aiContent.categoryInfo.detectedCategory)
        }
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
    } finally {
      setAiGenerating(false)
    }
  }

  const fetchPricingData = async () => {
    if (!product) return
    setFetchingMarketData(true)
    
    try {
      // Fetch market research data
      const response = await fetch(`/api/optimizer/market-research?productId=${product.id}&upc=${product.upc}`)
      
      if (response.ok) {
        const data = await response.json()
        setMarketData(data)
        setShowPricingModal(true)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch pricing data:', errorData.error)
        // Still show modal with existing offers if available
        if (product.offers && product.offers.length > 0) {
          setShowPricingModal(true)
        } else {
          alert('No pricing data available for this product')
        }
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error)
      // Still show modal with existing offers if available
      if (product.offers && product.offers.length > 0) {
        setShowPricingModal(true)
      } else {
        alert('Error fetching pricing data')
      }
    } finally {
      setFetchingMarketData(false)
    }
  }

  const createEbayDraft = async () => {
    if (!product || creatingDraft) return
    setCreatingDraft(true)
    
    try {
      const response = await fetch('/api/listings/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          marketplace: 'EBAY',
          price: product.lowestRecordedPrice || 0,
          quantity: product.quantity || 1,
          title: product.title,
          description: product.description
        })
      })
      
      if (response.ok) {
        const draft = await response.json()
        // Show success feedback
        const successMsg = document.createElement('div')
        successMsg.innerHTML = '✅ eBay draft created successfully!'
        successMsg.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
        document.body.appendChild(successMsg)
        setTimeout(() => document.body.removeChild(successMsg), 3000)
        
        // Optionally redirect to listings page
        router.push('/listings')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create eBay draft')
      }
    } catch (error) {
      console.error('Error creating eBay draft:', error)
      // Show error feedback
      const errorMsg = document.createElement('div')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      errorMsg.innerHTML = `❌ Failed to create eBay draft: ${errorMessage}`
      errorMsg.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
      document.body.appendChild(errorMsg)
      setTimeout(() => document.body.removeChild(errorMsg), 4000)
    } finally {
      setCreatingDraft(false)
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

  const fetchExternalImages = async () => {
    if (!product || fetchingImages) return
    setFetchingImages(true)
    
    try {
      const response = await fetch('/api/images/fetch-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          upc: product.upc,
          sources: ['amazon', 'ebay', 'upcitemdb']
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Update product with new images
        if (result.data?.images && result.data.images.length > 0) {
          const updatedImages = [...(product.images || []), ...result.data.images]
            .map((img, idx) => ({ ...img, imageNumber: idx + 1 }))
          
          setProduct({ ...product, images: updatedImages })
          setHasUnsavedChanges(true)
          
          // Show success feedback
          const successMsg = document.createElement('div')
          successMsg.innerHTML = `✅ Fetched ${result.data.fetched} new images successfully!`
          successMsg.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
          document.body.appendChild(successMsg)
          setTimeout(() => document.body.removeChild(successMsg), 3000)
        } else {
          // Show info message if no images found
          const infoMsg = document.createElement('div')
          infoMsg.innerHTML = '📷 No new images found from external sources'
          infoMsg.className = 'fixed top-20 right-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
          document.body.appendChild(infoMsg)
          setTimeout(() => document.body.removeChild(infoMsg), 3000)
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch images')
      }
    } catch (error) {
      console.error('Error fetching external images:', error)
      // Show error feedback
      const errorMsg = document.createElement('div')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      errorMsg.innerHTML = `❌ Failed to fetch images: ${errorMessage}`
      errorMsg.className = 'fixed top-20 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
      document.body.appendChild(errorMsg)
      setTimeout(() => document.body.removeChild(errorMsg), 4000)
    } finally {
      setFetchingImages(false)
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
              Please wait while we load the product details
            </p>
          </div>
          
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
            <p className="text-sm text-muted-foreground mt-1">
              The product you're looking for doesn't exist
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-muted-foreground">Product not found</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout
      actions={
        <div className="flex items-center space-x-3">
          {/* Save Button - Always visible in header */}
          <Button 
            variant={hasUnsavedChanges ? "primary" : "outline"}
            size="sm" 
            onClick={saveProduct}
            disabled={saving}
            className={`
              transition-all duration-200 min-w-[100px]
              ${hasUnsavedChanges 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg scale-105' 
                : 'hover:bg-accent'
              }
              ${saving ? 'animate-pulse' : ''}
            `}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
              </>
            )}
          </Button>
          
          {/* Unsaved changes indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center text-orange-600 dark:text-orange-400 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
              Unsaved changes
            </div>
          )}
          
          {/* Back button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (hasUnsavedChanges) {
                const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave?')
                if (!confirmLeave) return
              }
              router.push('/inventory')
            }}
          >
            Back to Inventory
          </Button>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Product Details</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your product information
              </p>
            </div>
          </div>
        </div>
        {/* Product Header Card */}
        <div className="bg-card rounded-xl border border-border mb-6">
          {/* Product Title & Basic Info */}
          <div className="p-4 border-b border-border">
            <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              {product.title || "Untitled Product"}
            </h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">UPC:</span>
                <div className="font-mono font-medium">{product.upc}</div>
              </div>
              {product.brand && (
                <div>
                  <span className="text-muted-foreground">Brand:</span>
                  <div className="font-medium">{product.brand}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Quantity:</span>
                <div className="font-medium">{product.quantity}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Condition:</span>
                <div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    product.condition === 'New' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {product.condition || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Actions */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button 
                variant="primary" 
                size="sm" 
                onClick={generateAIContent}
                loading={aiGenerating}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-initial"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {aiGenerating ? 'Optimizing...' : 'AI Optimize All Fields'}
              </Button>
              <Button variant="primary" size="sm" onClick={saveProduct} loading={saving} className="flex-1 sm:flex-initial">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
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

                  {product.aiContent?.seoKeywords && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        AI Generated SEO Keywords
                      </h4>
                      <p className="text-sm">{product.aiContent.seoKeywords}</p>
                    </div>
                  )}

                  {product.aiContent?.tags && product.aiContent.tags.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                        AI Generated Tags
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {product.aiContent.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      SEO Keywords & Search Terms
                      <span className="text-xs text-muted-foreground block mt-1">
                        Enter search terms buyers might use to find this product
                      </span>
                    </label>
                    <Input
                      value={product.features || ''}
                      onChange={(e) => handleFieldChange('features', e.target.value)}
                      placeholder="e.g., vintage, collectible, rare, limited edition, authentic, quality"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the AI Optimize button above to auto-generate SEO keywords based on your product
                    </p>
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Price Range: ${product.lowestRecordedPrice?.toFixed(2)} - ${product.highestRecordedPrice?.toFixed(2)}
                        </p>
                        <button
                          onClick={fetchPricingData}
                          disabled={fetchingMarketData}
                          className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors disabled:opacity-50"
                          title="View pricing details and market research"
                        >
                          {fetchingMarketData ? (
                            <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <TrendingUp className="w-3 h-3" />
                              <span>View Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
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

            {/* eBay Item Specifics - Dynamic Category-Based */}
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection('itemSpecifics')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    eBay Item Specifics
                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                      {categorySpec.categoryName}
                    </span>
                  </CardTitle>
                  {expandedSections.itemSpecifics ? <ChevronUp /> : <ChevronDown />}
                </div>
              </CardHeader>
              {expandedSections.itemSpecifics && (
                <CardContent className="space-y-6">
                  {/* Category Selection */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">Category Detection</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          Auto-detected: {categorySpec.categoryName} ({categorySpec.categoryPath})
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const detected = detectEbayCategory(product!)
                            handleCategoryChange(detected)
                          }}
                          className="text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Re-detect
                        </Button>
                        <select
                          value={selectedCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="text-xs border border-input rounded px-2 py-1 bg-background"
                        >
                          {getAllCategories().map(({ key, spec }) => (
                            <option key={key} value={key}>
                              {spec.categoryName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Template Management */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center">
                          <Bookmark className="w-4 h-4 mr-2" />
                          Templates & Defaults
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          Save time with templates for common product types
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowTemplateModal(true)}
                          className="text-xs"
                          disabled={loadingTemplates}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Load Template
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowSaveTemplateForm(true)}
                          className="text-xs"
                        >
                          <BookmarkPlus className="w-3 h-3 mr-1" />
                          Save as Template
                        </Button>
                      </div>
                    </div>
                    
                    {/* Save Template Form */}
                    {showSaveTemplateForm && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 border rounded-lg">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Template name (e.g., 'Standard Funko Pop')"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className="flex-1 text-sm border border-input rounded px-2 py-1"
                          />
                          <Button 
                            size="sm"
                            onClick={saveCurrentAsTemplate}
                            className="text-xs"
                          >
                            Save
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowSaveTemplateForm(false)
                              setNewTemplateName('')
                            }}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This will save your current values (excluding unique fields like UPC, Character)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Validation Errors:</h5>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dynamic Item Specifics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorySpec.itemSpecifics.map((spec: EbayItemSpecific) => (
                      <div key={spec.name}>
                        <label className="block text-sm font-medium mb-1">
                          {spec.name} 
                          {spec.required && <span className="text-red-500 ml-1">*</span>}
                          {spec.description && (
                            <span className="text-xs text-muted-foreground block mt-1">
                              {spec.description}
                            </span>
                          )}
                        </label>
                        
                        {spec.type === 'select' ? (
                          <div className="relative">
                            <select
                              value={itemSpecifics[spec.name] || ''}
                              onChange={(e) => handleItemSpecificChange(spec.name, e.target.value)}
                              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pr-10"
                            >
                              <option value="">Select {spec.name.toLowerCase()}</option>
                              {spec.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            {itemSpecifics[spec.name] && (
                              <button
                                onClick={() => setFieldAsDefault(spec.name, itemSpecifics[spec.name])}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-500 hover:text-yellow-600"
                                title={`Set '${itemSpecifics[spec.name]}' as default for ${spec.name}`}
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : spec.type === 'multiselect' ? (
                          <div className="border border-input rounded-lg p-2 max-h-32 overflow-y-auto">
                            {spec.options?.map(option => (
                              <label key={option} className="flex items-center space-x-2 text-sm py-1">
                                <input
                                  type="checkbox"
                                  checked={(itemSpecifics[spec.name] || '').split(',').includes(option)}
                                  onChange={(e) => {
                                    const current = (itemSpecifics[spec.name] || '').split(',').filter(Boolean)
                                    if (e.target.checked) {
                                      handleItemSpecificChange(spec.name, [...current, option].join(','))
                                    } else {
                                      handleItemSpecificChange(spec.name, current.filter(v => v !== option).join(','))
                                    }
                                  }}
                                  className="rounded"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : spec.type === 'number' ? (
                          <input
                            type="number"
                            value={itemSpecifics[spec.name] || ''}
                            onChange={(e) => handleItemSpecificChange(spec.name, e.target.value)}
                            placeholder={spec.placeholder}
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        ) : (
                          <input
                            type="text"
                            value={itemSpecifics[spec.name] || ''}
                            onChange={(e) => handleItemSpecificChange(spec.name, e.target.value)}
                            placeholder={spec.placeholder}
                            maxLength={spec.maxLength}
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          />
                        )}
                        
                        {spec.maxLength && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(itemSpecifics[spec.name] || '').length}/{spec.maxLength} characters
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Variants Section (for clothing, etc.) */}
                  {categorySpec.supportsVariants && categorySpec.variants && (
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center">
                          <Settings className="w-4 h-4 mr-2" />
                          Product Variants
                          <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            Size, Color, etc.
                          </span>
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categorySpec.variants.map((variant, variantIndex) => {
                          const currentVariant = variants.find(v => v.name === variant.name)
                          return (
                            <div key={variant.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <h5 className="font-medium mb-3">
                                {variant.name}
                                {variant.required && <span className="text-red-500 ml-1">*</span>}
                              </h5>
                              
                              {variant.type === 'select' && variant.options ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {variant.options.map(option => (
                                      <button
                                        key={option}
                                        onClick={() => {
                                          if (!currentVariant?.options.includes(option)) {
                                            addVariantOption(variant.name, option)
                                          }
                                        }}
                                        disabled={currentVariant?.options.includes(option)}
                                        className="px-2 py-1 text-xs border rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {option}
                                      </button>
                                    ))}
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">Selected {variant.name}s:</p>
                                    {currentVariant?.options.map((option, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                                        <span>{option}</span>
                                        <button
                                          onClick={() => removeVariantOption(variant.name, optionIndex)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )) || (
                                      <p className="text-xs text-muted-foreground italic">No {variant.name.toLowerCase()}s selected</p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={`Enter ${variant.name.toLowerCase()} options (comma-separated)`}
                                  className="w-full text-sm border border-input rounded px-2 py-1"
                                  onChange={(e) => {
                                    const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    setVariants(prev => prev.map(v => 
                                      v.name === variant.name ? { ...v, options } : v
                                    ))
                                  }}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom Item Specifics */}
                  <div className="border-t pt-6">
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
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Validation Button */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {categorySpec.features.maxImages && (
                        <span>Max images: {categorySpec.features.maxImages} • </span>
                      )}
                      {categorySpec.features.supportsVideo ? 'Video supported' : 'No video support'}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={validateCurrentCategory}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Validate Fields
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Column - Images & Quick Actions */}
          <div className="space-y-6">
            {/* Product Images & Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="w-5 h-5 mr-2" />
                  Product Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Images Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Images</h4>
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
                      <div className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No images</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Videos Section */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Videos (eBay Compatible)</h4>
                    {product.videos && product.videos.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {product.videos.map((video, index) => (
                          <div key={video.id} className="relative group border border-border rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <Video className="w-8 h-8 text-blue-500" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Video {index + 1}</p>
                                {video.duration && (
                                  <p className="text-xs text-muted-foreground">
                                    Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                  </p>
                                )}
                              </div>
                              <button className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-20 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                        <div className="text-center">
                          <Video className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">No videos</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Images
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                    {((product.images && product.images.length > 0) || (product.videos && product.videos.length > 0)) && (
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={saveProduct}
                        title="Save media order"
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={fetchExternalImages}
                    disabled={fetchingImages}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    title="Automatically fetch product images from Amazon, eBay, and UPC databases"
                  >
                    {fetchingImages ? (
                      <div className="w-4 h-4 mr-2 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Image className="w-4 h-4 mr-2" />
                    )}
                    {fetchingImages ? 'Fetching Images...' : 'Fetch External Images'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={createEbayDraft}
                  disabled={creatingDraft}
                >
                  {creatingDraft ? (
                    <div className="w-4 h-4 mr-2 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {creatingDraft ? 'Creating Draft...' : 'Create eBay Draft'}
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
      
      {/* Pricing Comparison Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Pricing Analysis & Market Research</h2>
                  <p className="text-blue-100 text-sm">{product.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPricingModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column - Market Data */}
                <div className="space-y-4">
                  {marketData?.insights && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Market Insights
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300">Suggested Price</p>
                          <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                            ${marketData.insights.suggestedPrice?.toFixed(2) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300">Market Range</p>
                          <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                            ${marketData.insights.priceRange?.min?.toFixed(2)} - ${marketData.insights.priceRange?.max?.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300">Confidence</p>
                          <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                            {((marketData.insights.marketConfidence || 0) * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-300">Trend</p>
                          <p className="text-lg font-semibold text-green-800 dark:text-green-200 capitalize">
                            {marketData.insights.trend || 'Stable'}
                          </p>
                        </div>
                      </div>
                      
                      {marketData.insights.sellingPoints && marketData.insights.sellingPoints.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Key Selling Points:</p>
                          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                            {marketData.insights.sellingPoints.map((point: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* eBay Terapeak Section */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center">
                      <BarChart className="w-5 h-5 mr-2" />
                      eBay Terapeak Data
                      <span className="ml-2 text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Advanced market analytics including sold listings, demand trends, and competitive pricing will be available here.
                    </p>
                  </div>
                </div>
                
                {/* Right Column - Retailer Offers */}
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Current Retailer Prices ({product.offers?.length || 0})
                    </h3>
                    
                    {product.offers && product.offers.length > 0 ? (
                      <div className="space-y-3">
                        {product.offers.map((offer) => (
                          <div key={offer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">{offer.merchant}</h4>
                                <div className="flex items-center space-x-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {offer.condition && (
                                    <span>Condition: {offer.condition}</span>
                                  )}
                                  {offer.availability && (
                                    <span>• {offer.availability}</span>
                                  )}
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
                              </div>
                            </div>
                            {offer.link && (
                              <div className="mt-3 flex justify-end">
                                <a
                                  href={offer.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Visit Store
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Average Price */}
                        {product.offers.length > 1 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Average Price:</span>
                              <span className="text-lg font-bold text-blue-600 dark:text-blue-300">
                                ${(product.offers.reduce((sum, offer) => sum + (offer.price || 0), 0) / product.offers.length).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-500">No retailer offers available</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Pricing data will appear here when available from UPC databases
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {marketData?.insights?.suggestedPrice && (
                  <button
                    onClick={() => {
                      handleFieldChange('lowestRecordedPrice', marketData.insights.suggestedPrice)
                      setShowPricingModal(false)
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Apply Suggested Price (${marketData.insights.suggestedPrice.toFixed(2)})
                  </button>
                )}
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bookmark className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Load Template</h2>
                  <p className="text-green-100 text-sm">{categorySpec.categoryName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-6">
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3">Loading templates...</span>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No templates available for {categorySpec.categoryName}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Save your current setup as a template to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((template) => (
                    <div 
                      key={template.id} 
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {template.templateName}
                          </h4>
                          {template.isDefault && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                          {template.isSystemDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Built-in
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => applyTemplateToProduct(template)}
                          className="text-xs"
                        >
                          Apply Template
                        </Button>
                      </div>
                      
                      {/* Template Preview */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="mb-2">Fields included:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(template.templateData).map(([key, value]) => (
                            <span 
                              key={key}
                              className="inline-block bg-gray-100 dark:bg-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t flex gap-3">
                <Button 
                  variant="outline"
                  onClick={loadSmartDefaults}
                  className="flex-1 text-sm"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Apply Smart Defaults
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 text-sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
