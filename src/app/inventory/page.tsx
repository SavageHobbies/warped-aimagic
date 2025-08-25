'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import MultiMarketplaceExportModal from '@/components/MultiMarketplaceExportModal'
import { 
  Package, Plus, Search, Filter, Edit, Trash2, Eye, 
  Upload, BarChart, DollarSign, AlertCircle, CheckCircle,
  ShoppingCart, Send, FileText, Image as ImageIcon,
  Download, X, ChevronDown, FileSpreadsheet
} from 'lucide-react'

interface Product {
  id: string
  upc: string
  title: string
  brand?: string
  condition: string
  quantity: number
  price?: number
  lowestRecordedPrice?: number
  highestRecordedPrice?: number
  enhancementStatus?: string
  lastEnhanced?: string
  images?: Array<{ originalUrl?: string }>
  listingDrafts?: Array<{ id: string; status: string }>
}

export default function InventoryPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [filterCondition, setFilterCondition] = useState('all')
  const [filterEnhancement, setFilterEnhancement] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [showMultiExportModal, setShowMultiExportModal] = useState(false)
  const [creatingDrafts, setCreatingDrafts] = useState(false)
  const [deletingProducts, setDeletingProducts] = useState(false)
  const [enhancingProducts, setEnhancingProducts] = useState(false)
  const [editingField, setEditingField] = useState<{productId: string, field: string} | null>(null)
  const [editValue, setEditValue] = useState('')

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

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProducts(newSelected)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.upc?.includes(searchTerm) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCondition = filterCondition === 'all' || product.condition === filterCondition
    const matchesEnhancement = filterEnhancement === 'all' || 
                               (filterEnhancement === 'enhanced' && product.enhancementStatus === 'enhanced') ||
                               (filterEnhancement === 'not_enhanced' && (product.enhancementStatus === 'not_enhanced' || !product.enhancementStatus))
    return matchesSearch && matchesCondition && matchesEnhancement
  })

  const bulkCreateDrafts = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select products to create drafts for')
      return
    }

    setCreatingDrafts(true)
    const productIds = Array.from(selectedProducts)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    try {
      console.log('Creating eBay drafts for products:', productIds)
      
      // Create drafts for each selected product
      for (const productId of productIds) {
        try {
          const product = products.find(p => p.id === productId)
          if (!product) {
            errors.push(`Product ${productId} not found`)
            errorCount++
            continue
          }

          const response = await fetch('/api/listings/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: productId,
              marketplace: 'EBAY',
              price: product.lowestRecordedPrice || 0,
              quantity: product.quantity || 1,
              title: product.title,
              description: product.title // Use title as basic description if none
            })
          })

          if (response.ok) {
            successCount++
            console.log(`✅ Created draft for: ${product.title}`)
          } else {
            const errorData = await response.json()
            errors.push(`${product.title}: ${errorData.error || 'Unknown error'}`)
            errorCount++
          }
        } catch (error) {
          console.error(`Error creating draft for product ${productId}:`, error)
          const productTitle = products.find(p => p.id === productId)?.title || productId
          errors.push(`${productTitle}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          errorCount++
        }
      }

      // Show results
      if (successCount > 0 && errorCount === 0) {
        // Complete success
        const successMsg = document.createElement('div')
        successMsg.innerHTML = `✅ Successfully created ${successCount} eBay drafts!`
        successMsg.className = 'fixed top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right'
        document.body.appendChild(successMsg)
        setTimeout(() => document.body.removeChild(successMsg), 4000)
        
        // Clear selection and redirect to listings
        setSelectedProducts(new Set())
        router.push('/listings')
      } else if (successCount > 0 && errorCount > 0) {
        // Partial success
        alert(`Partial success: Created ${successCount} drafts, ${errorCount} failed.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`)
        setSelectedProducts(new Set())
        router.push('/listings')
      } else {
        // Complete failure
        alert(`Failed to create drafts for all ${errorCount} products.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`)
      }
    } catch (error) {
      console.error('Bulk draft creation error:', error)
      alert('Failed to create drafts. Please try again.')
    } finally {
      setCreatingDrafts(false)
    }
  }

  const handleMultiMarketplaceExport = async (options: any) => {
    try {
      if (options.type === 'csv') {
        // Handle CSV export to multiple marketplaces
        const results = []
        
        for (const marketplace of options.marketplaces) {
          const response = await fetch('/api/exports/csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: options.productIds || Array.from(selectedProducts),
              marketplace,
              customFields: options.customFields
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            results.push({ marketplace, ...result })
          } else {
            throw new Error(`Failed to export to ${marketplace}`)
          }
        }
        
        // Download all generated files
        for (const result of results) {
          if (result.downloadUrl) {
            const downloadResponse = await fetch(result.downloadUrl)
            const blob = await downloadResponse.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = result.filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
          }
        }
        
        alert(`Successfully exported to ${results.length} marketplace(s)`)
        
      } else if (options.type === 'baselinker') {
        // Handle BaseLinker sync
        const response = await fetch('/api/baselinker/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productIds: options.productIds || Array.from(selectedProducts),
            action: 'add'
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          alert(`BaseLinker sync completed: ${result.results.successCount} successful, ${result.results.errorCount} errors`)
        } else {
          throw new Error('BaseLinker sync failed')
        }
      }
      
      // Clear selection after successful export
      setSelectedProducts(new Set())
      
    } catch (error) {
      console.error('Multi-marketplace export error:', error)
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const bulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select products to delete')
      return
    }

    const productIds = Array.from(selectedProducts)
    const confirmMessage = `Are you sure you want to delete ${productIds.length} product${productIds.length > 1 ? 's' : ''}? This action cannot be undone.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setDeletingProducts(true)

    try {
      const response = await fetch('/api/products/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          force: false // Don't force delete initially
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Success
        alert(`Successfully deleted ${result.summary.deleted} product(s)`)
        
        // Refresh inventory
        await fetchInventory()
        setSelectedProducts(new Set())
      } else if (response.status === 409) {
        // Products have references
        const forceDelete = confirm(
          `${result.productsWithReferences.length} products have existing listings or drafts. Delete anyway?\n\n` +
          result.productsWithReferences.map((p: any) => 
            `• ${p.title} (${p.references.listings} listings, ${p.references.drafts} drafts)`
          ).join('\n')
        )
        
        if (forceDelete) {
          // Retry with force
          const forceResponse = await fetch('/api/products/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds,
              force: true
            })
          })
          
          const forceResult = await forceResponse.json()
          
          if (forceResponse.ok && forceResult.success) {
            alert(`Force deleted ${forceResult.summary.deleted} product(s)`)
            await fetchInventory()
            setSelectedProducts(new Set())
          } else {
            alert(`Force delete failed: ${forceResult.error}`)
          }
        }
      } else {
        alert(`Delete failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Error deleting products:', error)
      alert('Failed to delete products. Please try again.')
    } finally {
      setDeletingProducts(false)
    }
  }

  const bulkEnhanceProducts = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select products to enhance')
      return
    }

    const productIds = Array.from(selectedProducts)
    const confirmMessage = `Comprehensively enhance ${productIds.length} product${productIds.length > 1 ? 's' : ''} with:\n\n• AI-generated titles and descriptions\n• External product data fetching\n• Market research and pricing\n• Complete product information\n\nThis may take a few minutes.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setEnhancingProducts(true)
    let successCount = 0
    let errorCount = 0
    let pricingAppliedCount = 0
    let externalDataCount = 0
    const errors: string[] = []
    const enhancements: any[] = []

    try {
      console.log('Comprehensively enhancing products:', productIds)
      
      // Show progress indicator
      const progressDiv = document.createElement('div')
      progressDiv.innerHTML = `
        <div class="fixed top-20 right-6 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Enhancing 0 of ${productIds.length} products...</span>
          </div>
        </div>
      `
      document.body.appendChild(progressDiv)
      
      // Enhance each selected product with comprehensive enhancement
      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i]
        
        // Update progress
        const progressElement = progressDiv.querySelector('span')
        if (progressElement) {
          progressElement.textContent = `Enhancing ${i + 1} of ${productIds.length} products...`
        }
        
        try {
          const product = products.find(p => p.id === productId)
          if (!product) {
            errors.push(`Product ${productId} not found`)
            errorCount++
            continue
          }

          const response = await fetch('/api/ai/enhance-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: productId,
              includeMarketResearch: true,
              includePricing: true
            })
          })

          if (response.ok) {
            const result = await response.json()
            successCount++
            enhancements.push({
              title: product.title,
              result
            })
            
            // Track what was enhanced
            if (result.externalData) {
              externalDataCount++
            }
            if (result.marketResearch?.suggestedPrice) {
              pricingAppliedCount++
            }
            
            console.log(`✅ Enhanced: ${product.title}`, {
              externalData: !!result.externalData,
              marketResearch: !!result.marketResearch,
              pricing: !!result.marketResearch?.suggestedPrice
            })
          } else {
            const errorData = await response.json()
            errors.push(`${product.title}: ${errorData.error || 'Unknown error'}`)
            errorCount++
          }
        } catch (error) {
          console.error(`Error enhancing product ${productId}:`, error)
          const productTitle = products.find(p => p.id === productId)?.title || productId
          errors.push(`${productTitle}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          errorCount++
        }
        
        // Add delay between requests to avoid rate limiting
        if (i < productIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      }
      
      // Remove progress indicator
      document.body.removeChild(progressDiv)

      // Show comprehensive results
      if (successCount > 0 && errorCount === 0) {
        // Complete success
        const successMsg = document.createElement('div')
        successMsg.innerHTML = `
          <div class="fixed top-20 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-right max-w-md">
            <div class="font-bold text-lg mb-2">✅ Bulk Enhancement Complete!</div>
            <div class="text-sm space-y-1">
              <div>• ${successCount} products enhanced</div>
              <div>• ${externalDataCount} got external data</div>
              <div>• ${pricingAppliedCount} got pricing updates</div>
            </div>
          </div>
        `
        document.body.appendChild(successMsg)
        setTimeout(() => document.body.removeChild(successMsg), 5000)
        
        // Clear selection and refresh
        setSelectedProducts(new Set())
        await fetchInventory()
      } else if (successCount > 0 && errorCount > 0) {
        // Partial success
        const summaryMsg = `Bulk Enhancement Results:\n\n✅ ${successCount} products enhanced\n❌ ${errorCount} failed\n• ${externalDataCount} got external data\n• ${pricingAppliedCount} got pricing updates\n\nErrors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...and more' : ''}`
        alert(summaryMsg)
        setSelectedProducts(new Set())
        await fetchInventory()
      } else {
        // Complete failure
        alert(`Enhancement failed for all ${errorCount} products.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...and more' : ''}`)
      }
    } catch (error) {
      console.error('Bulk enhancement error:', error)
      alert('Failed to enhance products. Please try again.')
    } finally {
      setEnhancingProducts(false)
    }
  }

  const startEditing = (productId: string, field: string, currentValue: string | number) => {
    setEditingField({productId, field})
    setEditValue(String(currentValue || ''))
  }

  const cancelEditing = () => {
    setEditingField(null)
    setEditValue('')
  }

  const saveEdit = async () => {
    if (!editingField) return

    try {
      const updateData: any = {}
      
      if (editingField.field === 'quantity') {
        const quantity = parseInt(editValue)
        if (isNaN(quantity) || quantity < 0) {
          alert('Quantity must be a valid positive number')
          return
        }
        updateData.quantity = quantity
      } else {
        updateData[editingField.field] = editValue.trim()
      }

      const response = await fetch(`/api/products/${editingField.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.id === editingField.productId 
            ? { ...p, ...updateData }
            : p
        ))
        cancelEditing()
      } else {
        const error = await response.json()
        alert(`Failed to update: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving edit:', error)
      alert('Failed to save changes')
    }
  }

  const deleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    const confirmMessage = `Are you sure you want to delete "${product?.title}"? This action cannot be undone.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/products/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: [productId],
          force: false
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert('Product deleted successfully')
        await fetchInventory()
      } else if (response.status === 409) {
        const forceDelete = confirm(
          `This product has existing listings or drafts. Delete anyway?`
        )
        
        if (forceDelete) {
          const forceResponse = await fetch('/api/products/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productIds: [productId],
              force: true
            })
          })
          
          const forceResult = await forceResponse.json()
          
          if (forceResponse.ok && forceResult.success) {
            alert('Product force deleted')
            await fetchInventory()
          } else {
            alert(`Force delete failed: ${forceResult.error}`)
          }
        }
      } else {
        alert(`Delete failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product. Please try again.')
    }
  }

  return (
    <MainLayout
      actions={
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowMultiExportModal(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button variant="primary" size="sm" onClick={() => router.push('/add-product')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="transform transition-transform duration-200 hover:scale-110">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground transition-colors duration-200">
                Inventory
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{products.length} Products in Inventory</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredProducts.length !== products.length ? 
                  `${filteredProducts.length} products shown (filtered)` : 
                  'All products displayed'
                }
              </p>
            </div>
            {selectedProducts.size > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {selectedProducts.size} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={bulkCreateDrafts}
                  disabled={creatingDrafts}
                >
                  {creatingDrafts ? (
                    <>
                      <div className="w-4 h-4 mr-2 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Drafts ({selectedProducts.size})
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={bulkEnhanceProducts}
                  disabled={enhancingProducts}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  {enhancingProducts ? (
                    <>
                      <div className="w-4 h-4 mr-2 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <BarChart className="w-4 h-4 mr-2" />
                      AI Enhance ({selectedProducts.size})
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={bulkDeleteProducts}
                  disabled={deletingProducts}
                >
                  {deletingProducts ? (
                    <>
                      <div className="w-4 h-4 mr-2 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${products.reduce((sum, p) => sum + ((p.lowestRecordedPrice || 0) * p.quantity), 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ready to List</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.listingDrafts?.some(d => d.status === 'ready')).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">
                    {products.filter(p => p.quantity <= 2).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <input
                  type="text"
                  placeholder="Search by title, UPC, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              
              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value)}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
              >
                <option value="all">All Conditions</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
              
              <select
                value={filterEnhancement}
                onChange={(e) => setFilterEnhancement(e.target.value)}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
              >
                <option value="all">All Enhancement Status</option>
                <option value="enhanced">AI Enhanced</option>
                <option value="not_enhanced">Not Enhanced</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground"
              >
                <option value="updated">Recently Updated</option>
                <option value="title">Title A-Z</option>
                <option value="price">Price Low-High</option>
                <option value="quantity">Quantity</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
                <Button variant="primary" className="mt-4" onClick={() => router.push('/add-product')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === products.length}
                          onChange={handleSelectAll}
                          className="rounded border-input"
                        />
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Qty</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Image</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Condition</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Product</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Brand/UPC</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Price</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Enhancement</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className="border-b border-border hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/products/${product.id}`)}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => handleSelect(product.id)}
                            className="rounded border-input"
                          />
                        </td>
                        <td className="p-3">
                          {editingField?.productId === product.id && editingField?.field === 'quantity' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-20 px-2 py-1 border border-input rounded text-sm"
                                min="0"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                              />
                              <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span 
                              className={`font-medium cursor-pointer hover:bg-muted/50 px-2 py-1 rounded ${
                                product.quantity <= 2 ? 'text-orange-500' : 'text-foreground'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(product.id, 'quantity', product.quantity)
                              }}
                              title="Click to edit"
                            >
                              {product.quantity}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {product.images && product.images[0]?.originalUrl ? (
                            <img
                              src={product.images[0].originalUrl}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.condition === 'New' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {product.condition}
                          </span>
                        </td>
                        <td className="p-3">
                          {editingField?.productId === product.id && editingField?.field === 'title' ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 border border-input rounded text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit()
                                  if (e.key === 'Escape') cancelEditing()
                                }}
                              />
                              <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="font-medium text-foreground line-clamp-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(product.id, 'title', product.title)
                              }}
                              title="Click to edit"
                            >
                              {product.title || 'Untitled Product'}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {editingField?.productId === product.id && editingField?.field === 'brand' ? (
                              <div className="flex items-center space-x-2 mb-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 px-2 py-1 border border-input rounded text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit()
                                    if (e.key === 'Escape') cancelEditing()
                                  }}
                                />
                                <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="text-foreground cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditing(product.id, 'brand', product.brand || '')
                                }}
                                title="Click to edit"
                              >
                                {product.brand || 'No brand'}
                              </div>
                            )}
                            <div className="text-muted-foreground font-mono text-xs">{product.upc}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {product.price ? (
                              <div className="font-medium text-foreground">
                                ${product.price.toFixed(2)}
                              </div>
                            ) : product.lowestRecordedPrice ? (
                              <>
                                <div className="font-medium text-foreground">
                                  ${product.lowestRecordedPrice?.toFixed(2)}
                                </div>
                                {product.highestRecordedPrice && (
                                  <div className="text-muted-foreground text-xs">
                                    - ${product.highestRecordedPrice?.toFixed(2)}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">No price</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.enhancementStatus === 'enhanced'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {product.enhancementStatus === 'enhanced' ? '✨ Enhanced' : 'Not Enhanced'}
                          </span>
                        </td>
                        <td className="p-3">
                          {product.listingDrafts && product.listingDrafts.length > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {product.listingDrafts.length} draft(s)
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No drafts</span>
                          )}
                        </td>
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => router.push(`/products/${product.id}`)}
                              className="p-1 rounded hover:bg-muted"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => router.push(`/products/${product.id}`)}
                              className="p-1 rounded hover:bg-muted"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-muted"
                              title="Create Draft"
                            >
                              <Send className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1 rounded hover:bg-muted"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Multi-Marketplace Export Modal */}
      <MultiMarketplaceExportModal
        isOpen={showMultiExportModal}
        onClose={() => setShowMultiExportModal(false)}
        selectedProductIds={Array.from(selectedProducts)}
        totalProducts={products.length}
        onExport={handleMultiMarketplaceExport}
      />
    </MainLayout>
  )
}
