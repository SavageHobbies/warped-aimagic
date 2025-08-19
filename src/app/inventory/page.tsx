'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
  const [sortBy, setSortBy] = useState('updated')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'cpi' | 'baselinker' | 'ebay'>('cpi')
  const [exportScope, setExportScope] = useState<'selected' | 'filtered'>('filtered')
  const [exportOptions, setExportOptions] = useState({
    currency: 'USD',
    delimiter: ',',
    excelFriendly: true
  })
  const [exporting, setExporting] = useState(false)

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
    return matchesSearch && matchesCondition
  })

  const bulkCreateDrafts = async () => {
    // Create eBay drafts for selected products
    console.log('Creating drafts for:', selectedProducts)
  }

  const handleExport = async () => {
    if (exporting) return
    
    setExporting(true)
    try {
      // Prepare the request body
      const requestBody: any = {
        format: exportFormat,
        options: exportOptions
      }
      
      // Set selection based on scope
      if (exportScope === 'selected' && selectedProducts.size > 0) {
        requestBody.selection = {
          ids: Array.from(selectedProducts)
        }
      } else {
        // Export filtered products
        const filters: any = {}
        if (searchTerm) filters.search = searchTerm
        if (filterCondition !== 'all') filters.condition = filterCondition
        
        requestBody.selection = { filters }
      }
      
      // Make the API call
      const response = await fetch('/api/export/multi-format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        // Download the file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
        a.download = `inventory_${exportFormat}_${timestamp}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        // Close modal and show success
        setShowExportModal(false)
        alert(`Successfully exported ${exportScope === 'selected' ? selectedProducts.size : filteredProducts.length} products to ${exportFormat.toUpperCase()} format`)
      } else {
        const error = await response.json()
        alert(`Export failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <MainLayout
      title="Inventory Management"
      subtitle={`${products.length} products in inventory`}
      icon={<Package className="w-8 h-8 text-primary" />}
      actions={
        <div className="flex space-x-2">
          {selectedProducts.size > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={bulkCreateDrafts}>
                <Send className="w-4 h-4 mr-2" />
                Create Drafts ({selectedProducts.size})
              </Button>
            </>
          )}
          
          {/* Export Dropdown */}
          <div className="relative group">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <button
                onClick={() => {
                  setExportFormat('cpi')
                  setShowExportModal(true)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-blue-600" />
                CPI Sheet
              </button>
              <button
                onClick={() => {
                  setExportFormat('baselinker')
                  setShowExportModal(true)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Baselinker
              </button>
              <button
                onClick={() => {
                  setExportFormat('ebay')
                  setShowExportModal(true)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-purple-600" />
                eBay
              </button>
            </div>
          </div>
          
          <Button variant="primary" size="sm" onClick={() => router.push('/add-product')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      }
    >
      <div className="p-6">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by title, UPC, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground"
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
                      <th className="p-3 text-left text-sm font-medium text-foreground">Image</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Product</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Brand/UPC</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Qty</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Price Range</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Condition</th>
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
                          <div className="font-medium text-foreground line-clamp-2">
                            {product.title || 'Untitled Product'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="text-foreground">{product.brand || 'No brand'}</div>
                            <div className="text-muted-foreground font-mono text-xs">{product.upc}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`font-medium ${product.quantity <= 2 ? 'text-orange-500' : 'text-foreground'}`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {product.lowestRecordedPrice ? (
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
                            product.condition === 'New' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {product.condition}
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
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Export Inventory</h2>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setExportFormat('cpi')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      exportFormat === 'cpi'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <div className="text-xs font-medium">CPI</div>
                  </button>
                  <button
                    onClick={() => setExportFormat('baselinker')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      exportFormat === 'baselinker'
                        ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <div className="text-xs font-medium">Baselinker</div>
                  </button>
                  <button
                    onClick={() => setExportFormat('ebay')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      exportFormat === 'ebay'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <div className="text-xs font-medium">eBay</div>
                  </button>
                </div>
              </div>
              
              {/* Scope Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Scope
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <input
                      type="radio"
                      value="filtered"
                      checked={exportScope === 'filtered'}
                      onChange={(e) => setExportScope(e.target.value as 'filtered' | 'selected')}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        All Filtered Products ({filteredProducts.length})
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Export all products matching current filters
                      </div>
                    </div>
                  </label>
                  
                  {selectedProducts.size > 0 && (
                    <label className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <input
                        type="radio"
                        value="selected"
                        checked={exportScope === 'selected'}
                        onChange={(e) => setExportScope(e.target.value as 'filtered' | 'selected')}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Selected Products ({selectedProducts.size})
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Export only selected products
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              
              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Options
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Currency</span>
                    <select
                      value={exportOptions.currency}
                      onChange={(e) => setExportOptions({...exportOptions, currency: e.target.value})}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="PLN">PLN</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Delimiter</span>
                    <select
                      value={exportOptions.delimiter}
                      onChange={(e) => setExportOptions({...exportOptions, delimiter: e.target.value})}
                      className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    >
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.excelFriendly}
                      onChange={(e) => setExportOptions({...exportOptions, excelFriendly: e.target.checked})}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Excel Compatible (UTF-8 BOM)
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Format-specific info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {exportFormat === 'cpi' && (
                    <div>
                      <strong>CPI Format includes:</strong>
                      <ul className="mt-1 text-xs space-y-1">
                        <li>• SKU, Title, Purchase/List Price</li>
                        <li>• Quantity, Category, Supplier</li>
                        <li>• Barcode, Weight, Currency</li>
                      </ul>
                    </div>
                  )}
                  {exportFormat === 'baselinker' && (
                    <div>
                      <strong>Baselinker Format includes:</strong>
                      <ul className="mt-1 text-xs space-y-1">
                        <li>• Product name, SKU, EAN/UPC</li>
                        <li>• Price, Stock, Weight</li>
                        <li>• Description, Category, Images</li>
                      </ul>
                    </div>
                  )}
                  {exportFormat === 'ebay' && (
                    <div>
                      <strong>eBay Format includes:</strong>
                      <ul className="mt-1 text-xs space-y-1">
                        <li>• Title, Category, Condition</li>
                        <li>• Pricing, Quantity, Images</li>
                        <li>• Item Specifics, Brand, UPC/EAN</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
