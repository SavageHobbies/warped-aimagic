'use client'

import React, { useState, useEffect, useRef } from 'react'
import MainLayout from '@/components/MainLayout'
import { Package, Scan, CheckCircle, XCircle, Clock, Trash2, Plus, Zap, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface ScannedItem {
  id: string
  upc: string
  title?: string
  description?: string
  brand?: string
  quantityAdded: number
  totalQuantity?: number
  scannedAt: Date
  status: 'processing' | 'success' | 'error'
  message?: string
  isNewProduct?: boolean
}

export default function ScannerPage() {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [recentlyScanned, setRecentlyScanned] = useState<ScannedItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [totalScanned, setTotalScanned] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }

    // Load recently scanned from localStorage
    const saved = localStorage.getItem('recentlyScanned')
    if (saved) {
      try {
        const items = JSON.parse(saved)
        setRecentlyScanned(items)
        setTotalScanned(items.reduce((sum: number, item: ScannedItem) => sum + item.quantityAdded, 0))
      } catch (error) {
        console.error('Error loading recent scans:', error)
      }
    }
  }, [])

  // Save recently scanned to localStorage
  useEffect(() => {
    if (recentlyScanned.length > 0) {
      localStorage.setItem('recentlyScanned', JSON.stringify(recentlyScanned))
    }
  }, [recentlyScanned])

  const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim() || isProcessing) return

    setIsProcessing(true)
    const upc = barcodeInput.trim()

    // Create initial scan item
    const scanItem: ScannedItem = {
      id: generateId(),
      upc,
      quantityAdded: 1,
      scannedAt: new Date(),
      status: 'processing',
      message: 'Checking if product exists, then looking up details...'
    }

    // Add to recently scanned list immediately
    setRecentlyScanned(prev => [scanItem, ...prev.slice(0, 19)]) // Keep last 20 items
    setTotalScanned(prev => prev + 1)

    try {
      // Look up product information and add to inventory in one call
      const response = await fetch('/api/products/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          upc,
          addToInventory: true,
          quantity: 1
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Product lookup result:', result)
        
        // Check if this was an existing product or new one
        const isExistingProduct = result.source === 'database'
        
        // Update the scan item with success
        setRecentlyScanned(prev => 
          prev.map(item => 
            item.id === scanItem.id 
              ? {
                  ...item,
                  status: 'success' as const,
                  title: result.title,
                  brand: result.brand,
                  description: result.description,
                  totalQuantity: result.quantity,
                  isNewProduct: !isExistingProduct,
                  message: isExistingProduct 
                    ? `Found existing product! Added 1 more (total: ${result.quantity})`
                    : 'New product discovered and added to inventory'
                }
              : item
          )
        )
      } else if (response.status === 404) {
        // Product not found but we can still add it as a basic product
        const addResponse = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            upc,
            title: `Product ${upc}`,
            quantity: 1,
            condition: 'New'
          })
        })

        if (addResponse.ok) {
          setRecentlyScanned(prev => 
            prev.map(item => 
              item.id === scanItem.id 
                ? {
                    ...item,
                    status: 'success' as const,
                    title: `Product ${upc}`,
                    totalQuantity: 1,
                    isNewProduct: true,
                    message: 'Product not found in database, added as basic product'
                  }
                : item
            )
          )
        } else {
          throw new Error('Failed to add product to inventory')
        }
      } else {
        throw new Error('Failed to process product')
      }
    } catch (error) {
      console.error('Error processing barcode:', error)
      setRecentlyScanned(prev => 
        prev.map(item => 
          item.id === scanItem.id 
            ? {
                ...item,
                status: 'error' as const,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
              }
            : item
        )
      )
      setTotalScanned(prev => prev - 1) // Remove from count on error
    } finally {
      setBarcodeInput('')
      setIsProcessing(false)
      // Auto-focus the input immediately after processing to be ready for next scan
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select() // Highlight any text to make it ready for overwriting
        }
      }, 100) // Small delay to ensure state has updated
    }
  }

  const clearRecentScans = () => {
    if (confirm('Clear all recent scans?')) {
      setRecentlyScanned([])
      setTotalScanned(0)
      localStorage.removeItem('recentlyScanned')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 animate-in fade-in duration-300" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600 animate-in fade-in duration-300" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const actions = (
    <Link
      href="/inventory"
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
    >
      <Package className="w-4 h-4" />
      <span>View Inventory</span>
    </Link>
  )

  return (
    <MainLayout 
      actions={actions}
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Barcode Scanner</h1>
          <p className="text-sm text-muted-foreground mt-1">Scan barcodes to automatically add products to inventory</p>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scanning Interface */}
            <div className="space-y-6">
              {/* Scanner Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transform transition-all duration-200 hover:shadow-md hover:scale-[1.01]">
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${isProcessing ? 'animate-pulse scale-110' : 'hover:scale-105'}`}>
                    <Scan className={`w-10 h-10 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${isProcessing ? 'animate-spin' : ''}`} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Scan Product</h2>
                  <p className="text-gray-600 dark:text-gray-400">Enter or scan a barcode to add products to your inventory</p>
                </div>
                
                <form onSubmit={handleBarcodeSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Barcode/UPC
                    </label>
                    <input
                      ref={inputRef}
                      id="barcode"
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Scan or enter barcode..."
                      className="w-full px-4 py-4 text-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                      disabled={isProcessing}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isProcessing || !barcodeInput.trim()}
                    className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Package className="w-5 h-5" />
                        <span>Add to Inventory</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Stats Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transform transition-all duration-200 hover:shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300">{totalScanned}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Products Scanned</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-all duration-300">{recentlyScanned.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recent Items</div>
                  </div>
                </div>
                
                {recentlyScanned.length > 0 && (
                  <button
                    onClick={clearRecentScans}
                    className="w-full mt-4 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Recent Scans</span>
                  </button>
                )}
              </div>
            </div>

            {/* Recent Scans */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Scans</h3>
                {recentlyScanned.length > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Last {recentlyScanned.length} items
                  </span>
                )}
              </div>
              
              {recentlyScanned.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recent scans</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Start scanning barcodes to see them here</p>
                  <Link
                    href="/add-product"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product Manually</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentlyScanned.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-300 transform hover:scale-[1.02] animate-in slide-in-from-top-2 ${
                        item.status === 'success'
                          ? item.isNewProduct
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                          : item.status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {item.title || `UPC: ${item.upc}`}
                          </p>
                          {item.isNewProduct && item.status === 'success' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 animate-pulse">
                              <Zap className="w-3 h-3 mr-1" />
                              NEW
                            </span>
                          )}
                        </div>
                        {item.brand && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{item.brand}</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(item.scannedAt).toLocaleTimeString()}
                          </p>
                          <div className="flex items-center space-x-2">
                            {item.totalQuantity && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full transition-all duration-200 hover:bg-blue-200 dark:hover:bg-blue-800">
                                Qty: {item.totalQuantity}
                              </span>
                            )}
                            {item.status === 'success' && (
                              <TrendingUp className="w-3 h-3 text-green-500 animate-bounce" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
