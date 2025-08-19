'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import { Package, Edit, Save, X, ArrowLeft, Bot, ChevronLeft, ChevronRight, Eye, Trash2, Sparkles, Plus, ShoppingCart, Download, FileText, TrendingUp, DollarSign, Activity, Tag, AlertCircle, Target, TrendingDown, Video } from 'lucide-react'
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
  videos?: any[];
  itemSpecifics?: { [key: string]: string | string[] };
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
  condition?: 'new' | 'used' | 'refurbished' | 'damaged' | 'for_parts' | 'unknown'
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
  listingStatus?: 'draft' | 'active' | 'ended' | 'sold' | 'relisted'
  ebayItemId?: string
  viewCount?: number
  watchCount?: number
  // Detailed product information
  manufacturer?: string
  mpn?: string // Manufacturer Part Number
  isbn?: string
  countryOfOrigin?: string
  warrantyInfo?: string
  ageGroup?: 'adult' | 'teen' | 'kid' | 'toddler' | 'baby'
  gender?: 'male' | 'female' | 'unisex'
  theme?: string
  character?: string
  franchise?: string
  releaseDate?: string
  features?: string[]
  // Condition details
  conditionDescription?: string
  defects?: string[]
  includedItems?: string[]
  missingItems?: string[]
  // Shipping & handling
  packageDimensions?: string
  packageWeight?: string
  handlingTime?: number
  // Listing details
  listingDuration?: number
  startingBid?: number
  buyItNowPrice?: number
  acceptOffers?: boolean
  returnPolicy?: string
  shippingOptions?: Array<{
    service: string
    cost: number
    time: string
  }>
}

interface EditForm {
  itemSpecifics?: { [key: string]: string | string[] };
  title?: string
  description?: string
  brand?: string
  model?: string
  color?: string
  size?: string
  weight?: string
  dimensions?: string
  condition?: string
  material?: string
  mpn?: string
  ageGroup?: string
  theme?: string
  character?: string
  series?: string
  exclusivity?: string
  releaseDate?: string
  features?: string
  funkoPop?: boolean
  isbn?: string
  quantity?: number
  listingPrice?: number
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
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [fetchingMarketData, setFetchingMarketData] = useState(false)
  const [marketData, setMarketData] = useState<any>(null)
  const [showMarketModal, setShowMarketModal] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categorySearchResults, setCategorySearchResults] = useState([]);
  const [isSearchingCategories, setIsSearchingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryAspects, setCategoryAspects] = useState<any[] | null>(null);
  const [loadingAspects, setLoadingAspects] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    const fetchAspects = async () => {
      if (product && product.categories) {
        const primaryCategory = product.categories.find(c => c.isPrimary && c.category.type === 'EBAY');
        if (primaryCategory && primaryCategory.category.categoryId) {
          setLoadingAspects(true);
          try {
            const response = await fetch(`/api/ebay/categories/${primaryCategory.category.categoryId}/aspects`);
            if (response.ok) {
              const data = await response.json();
              setCategoryAspects(data);
            } else {
              console.error('Failed to fetch category aspects');
              setCategoryAspects(null);
            }
          } catch (error) {
            console.error('Error fetching aspects:', error);
            setCategoryAspects(null);
          } finally {
            setLoadingAspects(false);
          }
        } else {
          setCategoryAspects(null);
        }
      }
    };

    fetchAspects();
  }, [product]);

  const handleCategorySearch = async () => {
    if (!categorySearchQuery.trim()) return;
    setIsSearchingCategories(true);
    setCategoryError('');
    setCategorySearchResults([]);
    try {
      const response = await fetch(`/api/ebay/categories?query=${encodeURIComponent(categorySearchQuery)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch categories');
      }
      const data = await response.json();
      setCategorySearchResults(data);
      if (data.length === 0) {
        setCategoryError('No categories found for your query.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setCategoryError(message);
      console.error('Error searching categories:', message);
    } finally {
      setIsSearchingCategories(false);
    }
  };

  const handleItemSpecificsChange = (aspectName: string, value: string | string[]) => {
    setEditForm(prev => ({
      ...prev,
      itemSpecifics: {
        ...prev.itemSpecifics,
        [aspectName]: value,
      },
    }));
  };

  const handleVideoUpload = async () => {
    if (!videoFile || !product) {
      setVideoError('Please select a video file and ensure a product is loaded.');
      return;
    }

    setIsUploading(true);
    setVideoError('');
    setUploadProgress(0);

    try {
      // Step 1: Create the video resource on eBay and in our DB
      const createResponse = await fetch(`/api/products/${product.id}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: videoTitle || videoFile.name,
          size: videoFile.size,
          description: 'Product video',
        }),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.details || 'Failed to create video resource');
      }

      const videoData = await createResponse.json();
      const { ebayVideoId } = videoData;

      // Step 2: Upload the actual video file
      setUploadProgress(50); // Mark as halfway after creation

      const uploadResponse = await fetch(`/api/videos/${ebayVideoId}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: videoFile,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.details || 'Failed to upload video file');
      }

      setUploadProgress(100);
      alert('Video upload successful! It may take a few moments to process.');

      // Reset form and refresh product data
      setVideoFile(null);
      setVideoTitle('');
      await fetchProduct();

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      setVideoError(message);
      console.error('Video upload failed:', message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const renderDynamicFields = () => {
    if (loadingAspects) {
      return <p className="text-sm text-gray-500">Loading category fields...</p>;
    }

    if (!categoryAspects) {
      return null; // Don't render anything if no aspects
    }

    return (
      <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">Dynamic Item Specifics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryAspects.map((aspect) => {
            const aspectName = aspect.localizedAspectName;
            const isRequired = aspect.aspectConstraint.aspectUsage === 'REQUIRED';
            const hasValues = aspect.aspectValues && aspect.aspectValues.length > 0;

            if (hasValues) {
              return (
                <div key={aspectName}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {aspectName} {isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={editForm.itemSpecifics?.[aspectName] || ''}
                    onChange={(e) => handleItemSpecificsChange(aspectName, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <option value="">Select {aspectName}</option>
                    {aspect.aspectValues.map((val: any) => (
                      <option key={val.localizedValue} value={val.localizedValue}>
                        {val.localizedValue}
                      </option>
                    ))}
                  </select>
                </div>
              );
            } else {
              return (
                <div key={aspectName}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {aspectName} {isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={(editForm.itemSpecifics?.[aspectName] as string) || ''}
                    onChange={(e) => handleItemSpecificsChange(aspectName, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  const handleSelectCategory = async (category: { id: string, name: string, fullPath?: string }) => {
    try {
      const response = await fetch(`/api/products/${productId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          name: category.name,
          fullPath: category.fullPath || category.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to assign category');
      }

      alert('Category assigned successfully!');
      // Reset search and fetch updated product data
      setCategorySearchQuery('');
      setCategorySearchResults([]);
      await fetchProduct();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error assigning category: ${message}`);
      console.error('Error assigning category:', message);
    }
  };

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
          itemSpecifics: data.itemSpecifics || {},
          title: data.title || '',
          description: data.description || '',
          brand: data.brand || '',
          model: data.model || '',
          color: data.color || '',
          size: data.size || '',
          weight: data.weight || '',
          dimensions: data.dimensions || '',
          condition: data.condition || '',
          material: data.material || '',
          mpn: data.mpn || '',
          ageGroup: data.ageGroup || '',
          theme: data.theme || '',
          character: data.character || '',
          series: data.series || '',
          exclusivity: data.exclusivity || '',
          releaseDate: data.releaseDate || '',
          features: data.features || '',
          funkoPop: data.funkoPop || false,
          isbn: data.isbn || '',
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
          // Handle cases where the API call is successful but no content is generated
          const errorResult = result.results?.find((r: any) => r.status === 'error')
          const errorMessage = errorResult ? errorResult.message : 'The AI failed to generate content for an unknown reason.'
          console.error('AI content generation failed:', errorMessage)
          alert(`AI content generation failed: ${errorMessage}`)
        }
      } else {
        // Handle HTTP errors (e.g., 500, 400)
        const errorData = await response.json()
        console.error('Failed to generate AI content:', errorData)
        alert(`Failed to generate AI content: ${errorData.error || 'Unknown server error'}`)
      }
    } catch (error) {
      console.error('Error in handleAIEnhance:', error)
      alert(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

    console.log('Frontend: Starting eBay export for product:', product.id)
    console.log('Frontend: Product title:', product.title)
    console.log('Frontend: Product AI content status:', product.aiContent?.status)
    setExporting(true)

    try {
      const requestBody = {
        productIds: [product.id],
        templateType: 'funko_toys_games_movies', // Default template
        useDynamicCategories: true
      }
      
      console.log('Frontend: Sending request to /api/ebay/export with body:', requestBody)
      
      const response = await fetch('/api/ebay/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('Frontend: Received response status:', response.status)
      console.log('Frontend: Response headers:', response.headers)

      if (response.ok) {
        console.log('Frontend: Export successful, downloading file...')
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
        console.error('Frontend: Export failed with error data:', errorData)
        alert(`Failed to export to eBay: ${errorData.error || 'Unknown error'}\nDetails: ${errorData.details || ''}`)
      }
    } catch (error) {
      console.error('Frontend: Error exporting to eBay:', error)
      alert('Error exporting to eBay. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleGenerateTemplate = async () => {
    if (!product || generatingTemplate) return

    setGeneratingTemplate(true)
    try {
      const response = await fetch('/api/optimizer/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      })

      if (response.ok) {
        const data = await response.json()
        // Create a downloadable HTML file
        const blob = new Blob([data.html], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${product.title?.replace(/[^a-zA-Z0-9]/g, '_') || product.upc}_ebay_template.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('eBay template generated and downloaded successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to generate template: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error generating template:', error)
      alert('Error generating eBay template. Please try again.')
    } finally {
      setGeneratingTemplate(false)
    }
  }

  const handleMarketResearch = async () => {
    if (!product || fetchingMarketData) return

    setFetchingMarketData(true)
    try {
      const response = await fetch('/api/optimizer/market-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      })

      if (response.ok) {
        const data = await response.json()
        setMarketData(data)
        setShowMarketModal(true)
      } else {
        const errorData = await response.json()
        alert(`Failed to fetch market data: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
      alert('Error fetching market research data. Please try again.')
    } finally {
      setFetchingMarketData(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Product not found</h3>
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

  // Quick action buttons for mobile/desktop
  const quickActions = [
    {
      onClick: () => setEditing(true),
      icon: Edit,
      label: 'Edit',
      color: 'bg-blue-600 hover:bg-blue-700',
      show: !editing
    },
    {
      onClick: handleAIEnhance,
      icon: Sparkles,
      label: product.aiContent?.status === 'completed' ? 'Regenerate AI' : 'Generate AI',
      color: 'bg-purple-600 hover:bg-purple-700',
      loading: aiEnhancing,
      show: !editing
    },
    {
      onClick: handleEbayExport,
      icon: Download,
      label: 'Export CSV',
      color: 'bg-green-600 hover:bg-green-700',
      loading: exporting,
      show: !editing
    },
    {
      onClick: handleGenerateTemplate,
      icon: FileText,
      label: 'eBay Template',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      loading: generatingTemplate,
      show: !editing
    },
    {
      onClick: handleMarketResearch,
      icon: TrendingUp,
      label: 'Market Research',
      color: 'bg-teal-600 hover:bg-teal-700',
      loading: fetchingMarketData,
      show: !editing
    },
    {
      onClick: handleDelete,
      icon: Trash2,
      label: 'Delete',
      color: 'bg-red-600 hover:bg-red-700',
      show: !editing
    }
  ].filter(action => action.show)

  const actions = (
    <div className="flex flex-wrap gap-2">
      {!editing ? (
        <>
          {/* Desktop: Show all buttons with labels */}
          <div className="hidden lg:flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.loading}
                className={`px-4 py-2 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-all ${action.color}`}
              >
                {action.loading ? (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <action.icon className="w-4 h-4" />
                )}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          
          {/* Mobile: Show icon-only buttons */}
          <div className="flex lg:hidden flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.loading}
                className={`p-2 text-white rounded-lg disabled:opacity-50 transition-all ${action.color}`}
                title={action.label}
              >
                {action.loading ? (
                  <div className="w-5 h-5 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <action.icon className="w-5 h-5" />
                )}
              </button>
            ))}
          </div>
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
                itemSpecifics: product.itemSpecifics || {},
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
  )

  return (
    <MainLayout
      title={product.title || `Product ${product.upc}`}
      subtitle={`UPC: ${product.upc}${product.brand ? ` • Brand: ${product.brand}` : ''}${product.aiContent ? ` • AI Content: ${product.aiContent.status}` : ''}`}
      actions={actions}
    >
      <div className="p-6">

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'basic', label: 'Basic Info', icon: Package },
              { id: 'ai', label: 'AI Content', icon: Bot },
              { id: 'images', label: `Images (${product.images.length})`, icon: Eye },
              { id: 'offers', label: `Offers (${product.offers.length})`, icon: ShoppingCart },
              { id: 'categories', label: 'Categories', icon: Plus },
              { id: 'videos', label: 'Videos', icon: Video }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'basic' | 'ai' | 'images' | 'offers' | 'categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center space-x-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Basic Product Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Image */}
              <div className="space-y-4">
                <div 
                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer group relative"
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
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventory</h3>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{product.quantity}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Units in stock</div>
                  </div>
                  
                  {(product.lowestRecordedPrice || product.highestRecordedPrice) && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</h3>
                      <div className="space-y-1">
                        {product.lowestRecordedPrice && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Low:</span>
                            <span className="text-green-600 dark:text-green-400 font-semibold ml-2">
                              ${product.lowestRecordedPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {product.highestRecordedPrice && (
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">High:</span>
                            <span className="text-green-600 dark:text-green-400 font-semibold ml-2">
                              ${product.highestRecordedPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {getAveragePrice() && (
                          <div className="text-sm pt-1 border-t border-gray-200">
                            <span className="text-gray-500 dark:text-gray-400">Average:</span>
                            <span className="text-green-600 dark:text-green-400 font-semibold ml-2">
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Title</label>
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Enter product title"
                      />
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
                        <input
                          type="text"
                          value={editForm.brand || ''}
                          onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
                        <input
                          type="text"
                          value={editForm.model || ''}
                          onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {/* Description - Move up here */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Enter product description"
                      />
                    </div>

                    {/* Physical Properties */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                        <input
                          type="text"
                          value={editForm.color || ''}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size</label>
                        <input
                          type="text"
                          value={editForm.size || ''}
                          onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight</label>
                        <input
                          type="text"
                          value={editForm.weight || ''}
                          onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {/* Dimensions and Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dimensions</label>
                        <input
                          type="text"
                          value={editForm.dimensions || ''}
                          onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="L x W x H"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                        <input
                          type="number"
                          value={editForm.quantity || 0}
                          onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
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
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This is a Funko Pop product</span>
                      </label>
                    </div>

                    {/* Funko Pop Fields */}
                    {editForm.funkoPop && (
                      <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                        <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-3">Funko Pop Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Character</label>
                            <input
                              type="text"
                              value={editForm.character || ''}
                              onChange={(e) => setEditForm({ ...editForm, character: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="e.g., Batman, Spider-Man"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Series</label>
                            <input
                              type="text"
                              value={editForm.series || ''}
                              onChange={(e) => setEditForm({ ...editForm, series: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="e.g., DC Comics, Marvel"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exclusivity</label>
                            <select
                              value={editForm.exclusivity || ''}
                              onChange={(e) => setEditForm({ ...editForm, exclusivity: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Release Date</label>
                            <input
                              type="text"
                              value={editForm.releaseDate || ''}
                              onChange={(e) => setEditForm({ ...editForm, releaseDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500 dark:placeholder-gray-400"
                              placeholder="e.g., 2023, Q1 2024"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional eBay Fields */}
                    <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">eBay Listing Fields</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">MPN (Manufacturer Part Number)</label>
                          <input
                            type="text"
                            value={editForm.mpn || ''}
                            onChange={(e) => setEditForm({ ...editForm, mpn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Material</label>
                          <input
                            type="text"
                            value={editForm.material || ''}
                            onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="e.g., Vinyl, Plastic"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                          <input
                            type="text"
                            value={editForm.theme || ''}
                            onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 dark:placeholder-gray-400"
                            placeholder="e.g., Movies, Comics, TV Shows"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age Group</label>
                          <select
                            value={editForm.ageGroup || ''}
                            onChange={(e) => setEditForm({ ...editForm, ageGroup: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    {renderDynamicFields()}
                    {/* Description - Move up earlier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-500"
                        placeholder="Enter product description"
                      />
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-6">
                    {/* Basic Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Product Details</h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">UPC/EAN</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.upc}</dd>
                          {product.ean && (
                            <dd className="text-xs text-gray-500 dark:text-gray-400">EAN: {product.ean}</dd>
                          )}
                        </div>
                        {product.brand && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Brand</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.brand}</dd>
                          </div>
                        )}
                        {product.model && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Model</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.model}</dd>
                          </div>
                        )}
                        {product.color && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Color</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.color}</dd>
                          </div>
                        )}
                        {product.size && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Size</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.size}</dd>
                          </div>
                        )}
                        {product.weight && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Weight</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.weight}</dd>
                          </div>
                        )}
                        {product.dimensions && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.dimensions}</dd>
                          </div>
                        )}
                        {product.material && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Material</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.material}</dd>
                          </div>
                        )}
                        {product.condition && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Condition</dt>
                            <dd className="mt-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                {product.condition}
                              </span>
                            </dd>
                          </div>
                        )}
                        {product.theme && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.theme}</dd>
                          </div>
                        )}
                        {product.character && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Character</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.character}</dd>
                          </div>
                        )}
                        {product.mpn && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">MPN</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.mpn}</dd>
                          </div>
                        )}
                        {product.lastScanned && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Scanned</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                              {new Date(product.lastScanned).toLocaleString()}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Description - moved up for better visibility */}
                    {product.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Description</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700 rounded-lg p-4">{product.description}</p>
                      </div>
                    )}

                    {/* Funko Pop Details - if applicable */}
                    {(product.character || (product as any).series || (product as any).exclusivity) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                          <span className="mr-2">🎁</span>
                          Collectible Details
                        </h3>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {product.character && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Character</dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.character}</dd>
                            </div>
                          )}
                          {(product as any).series && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Series</dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{(product as any).series}</dd>
                            </div>
                          )}
                          {(product as any).exclusivity && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Exclusivity</dt>
                              <dd className="mt-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                                  {(product as any).exclusivity}
                                </span>
                              </dd>
                            </div>
                          )}
                          {product.releaseDate && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Release Date</dt>
                              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{product.releaseDate}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Bot className="w-6 h-6 text-purple-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Generated Content</h2>
                  <div className="flex items-center space-x-2">
                    {product.aiContent && getAIStatusIcon(product.aiContent)}
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none placeholder-gray-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none placeholder-gray-500"
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
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SEO Title</h4>
                          <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{product.aiContent.seoTitle}</p>
                        </div>
                      )}
                      {product.aiContent?.ebayTitle && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">eBay Title</h4>
                          <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{product.aiContent.ebayTitle}</p>
                        </div>
                      )}
                    </div>

                    {product.aiContent?.shortDescription && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Short Description</h4>
                        <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{product.aiContent.shortDescription}</p>
                      </div>
                    )}

                    {product.aiContent?.productDescription && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Description</h4>
                        <div className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 whitespace-pre-wrap">
                          {product.aiContent.productDescription}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {product.aiContent?.tags && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {product.aiContent.tags.split(',').map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.aiContent?.keyFeatures && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Key Features</h4>
                          <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{product.aiContent.keyFeatures}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No AI Content Generated</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Generate SEO-optimized content for this product using AI</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Images ({product.images.length})</h2>
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
                <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Images</h3>
                <p className="text-gray-600 dark:text-gray-400">No images found for this product</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Market Offers ({product.offers.length})</h2>

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
                    <div key={offer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{offer.merchant}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Market Offers</h3>
                <p className="text-gray-600 dark:text-gray-400">No offers found for this product</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Manage Categories</h2>

            {/* Current Categories */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Assigned Categories</h3>
              {product.categories.length > 0 ? (
                <div className="space-y-3">
                  {product.categories.map((cat) => (
                    <div key={cat.category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{cat.category.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{cat.category.fullPath || `eBay ID: ${cat.category.categoryId}`}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {cat.isPrimary && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            Primary
                          </span>
                        )}
                        <button
                          onClick={() => alert('Delete functionality to be implemented')}
                          className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                          title="Remove category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No categories assigned.</p>
              )}
            </div>

            {/* Search for new Category */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Add eBay Category</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="e.g., 'Funko Pop Batman' or 'Women's dress'"
                  className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
                <button
                  onClick={handleCategorySearch}
                  disabled={isSearchingCategories || !categorySearchQuery}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSearchingCategories ? (
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Search
                </button>
              </div>
              {categoryError && <p className="text-sm text-red-600 mt-2">{categoryError}</p>}
            </div>

            {/* Search Results */}
            {isSearchingCategories && <p className="text-sm text-gray-500 mt-4">Searching...</p>}
            {categorySearchResults.length > 0 && !isSearchingCategories && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Search Results ({categorySearchResults.length})</h4>
                <ul className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {categorySearchResults.map((cat: any) => (
                    <li
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat)}
                      className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition-colors"
                    >
                      <p className="font-medium text-gray-800 dark:text-gray-200">{cat.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">eBay ID: {cat.id} • Mentions: {cat.count}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Manage Videos</h2>

            {/* Upload Form */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Upload New Video</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video Title</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="e.g., 'Product Demonstration'"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video File (max 150MB)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isUploading}
                  />
                </div>
                <button
                  onClick={handleVideoUpload}
                  disabled={isUploading || !videoFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isUploading ? 'Uploading...' : 'Upload Video'}
                </button>
                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
                {videoError && <p className="text-sm text-red-600">{videoError}</p>}
              </div>
            </div>

            {/* Existing Videos */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-3">Uploaded Videos</h3>
              {product.videos && product.videos.length > 0 ? (
                <div className="space-y-3">
                  {product.videos.map((video: any) => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{video.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status: {video.status}</p>
                      </div>
                      <button
                        onClick={() => alert('Delete functionality to be implemented')}
                        className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No videos uploaded for this product yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Market Research Modal */}
      {showMarketModal && marketData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Market Research Analysis</h2>
              </div>
              <button
                onClick={() => setShowMarketModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {/* Price Insights Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Pricing Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Suggested Price */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">Suggested Price</span>
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${marketData.insights?.suggestedPrice?.toFixed(2) || '0.00'}
                    </p>
                    {marketData.insights?.marketConfidence && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Confidence</span>
                          <span>{Math.round(marketData.insights.marketConfidence * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${marketData.insights.marketConfidence * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Range */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Market Range</span>
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        ${marketData.insights?.priceRange?.min?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-gray-500">-</span>
                      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        ${marketData.insights?.priceRange?.max?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    {marketData.insights?.trend && (
                      <div className="mt-2 flex items-center">
                        {marketData.insights.trend === 'rising' ? (
                          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        ) : marketData.insights.trend === 'falling' ? (
                          <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        ) : (
                          <Activity className="w-4 h-4 text-gray-500 mr-1" />
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {marketData.insights.trend} trend
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Competitor Count */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Competition</span>
                      <ShoppingCart className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {marketData.insights?.competitorCount || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active listings</p>
                  </div>
                </div>

                {/* Current Product Price Comparison */}
                {product.listingPrice && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Your Current Price:</span>
                        <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                          ${product.listingPrice.toFixed(2)}
                        </span>
                      </div>
                      {marketData.insights?.suggestedPrice && (
                        <div className="text-right">
                          {product.listingPrice > marketData.insights.suggestedPrice ? (
                            <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Above market price by ${(product.listingPrice - marketData.insights.suggestedPrice).toFixed(2)}
                            </span>
                          ) : product.listingPrice < marketData.insights.suggestedPrice ? (
                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Below market price by ${(marketData.insights.suggestedPrice - product.listingPrice).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-sm text-blue-600 dark:text-blue-400">Perfectly priced!</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selling Points */}
              {marketData.insights?.sellingPoints && marketData.insights.sellingPoints.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-600" />
                    Key Selling Points
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {marketData.insights.sellingPoints.map((point: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {marketData.insights?.keywords && marketData.insights.keywords.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2 text-blue-600" />
                    Recommended Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {marketData.insights.keywords.map((keyword: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Listings (if available) */}
              {marketData.marketData?.similarListings && marketData.marketData.similarListings.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Similar Listings</h3>
                  <div className="space-y-3">
                    {marketData.marketData.similarListings.slice(0, 5).map((listing: any, index: number) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {listing.title || 'Similar Product'}
                            </p>
                            {listing.condition && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Condition: {listing.condition}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                              ${listing.price?.toFixed(2) || '0.00'}
                            </p>
                            {listing.soldCount && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {listing.soldCount} sold
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    if (marketData.insights?.suggestedPrice) {
                      setEditForm({ ...editForm, listingPrice: marketData.insights.suggestedPrice })
                      setEditing(true)
                      setActiveTab('basic')
                      setShowMarketModal(false)
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Apply Suggested Price
                </button>
                <button
                  onClick={() => setShowMarketModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </MainLayout>
  )
}
