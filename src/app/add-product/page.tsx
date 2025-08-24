'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import BarcodeScanner from '@/components/BarcodeScanner'
import ImageProductIdentifier from '@/components/ImageProductIdentifier'
import { 
  Plus, Scan, Upload, Edit, FileUp, Sparkles,
  Camera, FileText, ArrowLeft,
  CheckCircle, AlertCircle, Loader2, X
} from 'lucide-react'

export default function AddProductPage() {
  const router = useRouter()
  const [activeMethod, setActiveMethod] = useState<'scanner' | 'image' | 'manual' | 'bulk' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  
  const [manualData, setManualData] = useState({
    title: '',
    upc: '',
    brand: '',
    category: '',
    condition: 'New',
    quantity: 1,
    price: '',
    description: ''
  })

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualData)
      })
      if (response.ok) {
        const product = await response.json()
        router.push(`/products/${product.id}`)
      }
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleProductIdentified = async (productData: Record<string, unknown>) => {
    try {
      setIsProcessing(true)
      
      // Check if the product was already created by the component (has an id)
      if (productData.id) {
        // Product already exists, just navigate to it
        const productId = productData.id as string
        const productTitle = productData.title as string || 'Unknown Product'
        
        setNotification({
          type: 'success',
          message: productData.message as string || `Product "${productTitle}" added successfully!`
        })
        
        setTimeout(() => {
          router.push(`/products/${productId}`)
        }, 1500)
        return
      }
      
      // Fallback: create product if not already created
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          quantity: 1
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const product = result.product || result // Handle different response formats
        setNotification({
          type: 'success',
          message: `Product "${product.title}" added successfully!`
        })
        setTimeout(() => {
          router.push(`/products/${product.id}`)
        }, 1500)
      } else {
        throw new Error('Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      setNotification({
        type: 'error',
        message: 'Failed to add product. Please try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        setNotification({
          type: 'error',
          message: 'Please select a CSV or Excel file (.csv, .xlsx, .xls)'
        })
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setNotification({
          type: 'error',
          message: 'File size must be less than 10MB'
        })
        return
      }
      
      setSelectedFile(file)
      setNotification({
        type: 'info',
        message: `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
      })
      console.log('Processing CSV/Excel file:', file)
      // TODO: Implement bulk CSV/Excel import
    }
  }

  const handleProcessFile = async () => {
    if (!selectedFile) return
    
    setIsProcessingFile(true)
    setNotification({
      type: 'info',
      message: 'Processing file...'
    })
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/products/bulk-import', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: `Import completed! ${result.result.created} products created, ${result.result.updated} updated${result.result.errors.length > 0 ? ` (${result.result.errors.length} errors)` : ''}`
        })
        
        setTimeout(() => {
          router.push('/inventory')
        }, 2000)
      } else {
        throw new Error(result.message || 'Import failed')
      }
      
    } catch (error) {
      console.error('File processing error:', error)
      setNotification({
        type: 'error',
        message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsProcessingFile(false)
    }
  }

  const handleChooseFileClick = () => {
    bulkFileInputRef.current?.click()
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (bulkFileInputRef.current) {
      bulkFileInputRef.current.value = ''
    }
    setNotification(null)
  }

  const downloadTemplate = () => {
    const headers = [
      'title',
      'upc',
      'brand',
      'category',
      'condition',
      'quantity',
      'price',
      'cost',
      'description',
      'color',
      'size'
    ]
    
    const sampleRow = [
      'Sample Product Title',
      '123456789012',
      'Sample Brand',
      'Electronics',
      'New',
      '1',
      '29.99',
      '15.00',
      'This is a sample product description',
      'Black',
      'Medium'
    ]
    
    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'product_import_template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const inputMethods = [
    {
      id: 'scanner',
      icon: Scan,
      title: 'Barcode Scanner',
      description: 'Scan UPC/EAN codes using your camera',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badge: 'Fast & Accurate'
    },
    {
      id: 'image',
      icon: Camera,
      title: 'Image Recognition',
      description: 'AI-powered product identification from photos',
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      badge: 'AI Powered',
      sparkle: true
    },
    {
      id: 'manual',
      icon: Edit,
      title: 'Manual Entry',
      description: 'Type in product details manually',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      badge: 'Full Control'
    },
    {
      id: 'bulk',
      icon: FileUp,
      title: 'Bulk Import',
      description: 'Upload CSV or Excel file with multiple products',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      badge: 'Time Saver'
    }
  ]

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="transform transition-transform duration-200 hover:scale-110">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground transition-colors duration-200">
                Add Products
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose your preferred method to add products to inventory
          </p>
        </div>
        
        {/* Notification */}
        {notification && (
          <div className={`
            mb-4 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top
            ${
              notification.type === 'success' 
                ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : notification.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
            }
          `}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!activeMethod ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {inputMethods.map((method) => (
              <div key={method.id} className="relative group">
                {method.sparkle && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div className="relative">
                      <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                      <div className="absolute inset-0 bg-yellow-400 blur-xl opacity-50 animate-ping" />
                    </div>
                  </div>
                )}
                <Card 
                  className={`
                    cursor-pointer transition-all duration-300 h-full
                    hover:scale-[1.02] hover:shadow-xl
                    ${method.bgColor} ${method.borderColor}
                    border-2 backdrop-blur-sm
                    group-hover:border-opacity-100
                  `}
                onClick={() => setActiveMethod(method.id as 'scanner' | 'image' | 'manual' | 'bulk')}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Badge */}
                      {method.badge && (
                        <div className="absolute top-3 right-3">
                          <span className={`
                            text-xs font-semibold px-2 py-1 rounded-full
                            bg-gradient-to-r ${method.color} text-white
                          `}>
                            {method.badge}
                          </span>
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className="relative">
                        <div className={`
                          p-5 rounded-2xl bg-gradient-to-br ${method.color}
                          text-white shadow-lg transform transition-transform
                          group-hover:scale-110 group-hover:rotate-3
                        `}>
                          <method.icon className="w-8 h-8" />
                        </div>
                        <div className={`
                          absolute inset-0 rounded-2xl bg-gradient-to-br ${method.color}
                          blur-xl opacity-30 group-hover:opacity-50 transition-opacity
                        `} />
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {method.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {method.description}
                        </p>
                      </div>
                      
                      {/* Hover indicator */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Click to select →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveMethod(null)
                setNotification(null)
              }}
              className="mb-6 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to methods
            </Button>

            {activeMethod === 'scanner' && (
              <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-2 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                      <Scan className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Scan Product Barcode
                      </span>
                    </CardTitle>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Position barcode in camera view
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <BarcodeScanner />
                </CardContent>
              </Card>
            )}

            {activeMethod === 'image' && (
              <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-2 shadow-xl overflow-hidden">
                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                      <div className="relative mr-3">
                        <Camera className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                      <span className="bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
                        AI Product Recognition
                      </span>
                    </CardTitle>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
                      Powered by Gemini Vision
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <ImageProductIdentifier 
                    onProductIdentified={handleProductIdentified}
                    isProcessing={isProcessing}
                  />
                </CardContent>
              </Card>
            )}

            {activeMethod === 'manual' && (
              <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-2 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                      <Edit className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400" />
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        Manual Product Entry
                      </span>
                    </CardTitle>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Fill in product details
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          Product Title *
                        </label>
                        <input
                          type="text"
                          value={manualData.title}
                          onChange={(e) => setManualData({...manualData, title: e.target.value})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          UPC/EAN Code
                        </label>
                        <input
                          type="text"
                          value={manualData.upc}
                          onChange={(e) => setManualData({...manualData, upc: e.target.value})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                          placeholder="Optional"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          Brand
                        </label>
                        <input
                          type="text"
                          value={manualData.brand}
                          onChange={(e) => setManualData({...manualData, brand: e.target.value})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          Category
                        </label>
                        <input
                          type="text"
                          value={manualData.category}
                          onChange={(e) => setManualData({...manualData, category: e.target.value})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          Condition
                        </label>
                        <select
                          value={manualData.condition}
                          onChange={(e) => setManualData({...manualData, condition: e.target.value})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                        >
                          <option value="New">New</option>
                          <option value="Like New">Like New</option>
                          <option value="Very Good">Very Good</option>
                          <option value="Good">Good</option>
                          <option value="Acceptable">Acceptable</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={manualData.quantity}
                          onChange={(e) => setManualData({...manualData, quantity: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={manualData.price}
                          onChange={(e) => setManualData({...manualData, price: e.target.value})}
                          className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                        Description
                      </label>
                      <textarea
                        value={manualData.description}
                        onChange={(e) => setManualData({...manualData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-input dark:border-gray-600 rounded-lg bg-background dark:bg-gray-700 dark:text-white"
                        rows={4}
                        placeholder="Enter product description..."
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setActiveMethod(null)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary">
                        Add Product
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeMethod === 'bulk' && (
              <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-2 shadow-xl">
                <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                      <FileUp className="w-6 h-6 mr-3 text-orange-600 dark:text-orange-400" />
                      <span className="bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                        Bulk Import Products
                      </span>
                    </CardTitle>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      CSV or Excel format
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* File Upload Area */}
                    {!selectedFile ? (
                      <div className="border-2 border-dashed border-border dark:border-gray-600 rounded-lg p-8 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
                        <p className="text-muted-foreground dark:text-gray-400 mb-4">
                          Upload CSV or Excel file with product data
                        </p>
                        <input
                          ref={bulkFileInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleBulkUpload}
                          className="hidden"
                          id="bulk-upload"
                        />
                        <Button 
                          variant="primary" 
                          onClick={handleChooseFileClick}
                          className="cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-green-800 dark:text-green-200">{selectedFile.name}</h4>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleClearFile}
                            disabled={isProcessingFile}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="primary" 
                            onClick={handleProcessFile}
                            disabled={isProcessingFile}
                            className="flex-1"
                          >
                            {isProcessingFile ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Process File
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleChooseFileClick}
                            disabled={isProcessingFile}
                          >
                            Choose Different File
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-muted/50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 dark:text-white">Required columns:</h4>
                      <ul className="text-sm text-muted-foreground dark:text-gray-400 space-y-1">
                        <li>• Title (required)</li>
                        <li>• UPC/EAN (optional)</li>
                        <li>• Brand</li>
                        <li>• Category</li>
                        <li>• Condition (New, Like New, Very Good, Good, Acceptable)</li>
                        <li>• Quantity</li>
                        <li>• Price</li>
                        <li>• Description</li>
                      </ul>
                    </div>
                    
                    <Button variant="outline" className="w-full" onClick={downloadTemplate}>
                      <FileText className="w-4 h-4 mr-2" />
                      Download Template CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
