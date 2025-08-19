'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Package, Scan, CheckCircle, XCircle, Clock, List, Trash2 } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

interface ScannedItem {
  id: string
  upc: string
  title?: string
  description?: string
  brand?: string
  imageUrl?: string
  quantityAdded: number
  totalQuantity?: number
  scannedAt: Date
  status: 'processing' | 'success' | 'error'
  message?: string
  isNewProduct?: boolean
  draftId?: string
  productId?: string
}

export default function BarcodeScanner() {
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

      console.log('Product lookup response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Product lookup result:', result)
        
        // Check if this was an existing product or new one
        const isExistingProduct = result.source === 'database'
        const previousQuantity = result.previousQuantity || 0
        const quantityAdded = result.quantityAdded || 1
        
        // Create a listing draft for the product
        let draftId = null
        try {
          const draftResponse = await fetch('/api/listings/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: result.id,
              marketplace: 'EBAY',
              price: result.lowestRecordedPrice || 0,
              quantity: 1
            })
          })
          
          if (draftResponse.ok) {
            const draft = await draftResponse.json()
            draftId = draft.id
          }
        } catch (error) {
          console.error('Error creating draft:', error)
        }
        
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
                  imageUrl: result.images?.[0]?.originalUrl || null,
                  totalQuantity: result.quantity,
                  isNewProduct: !isExistingProduct,
                  productId: result.id,
                  draftId: draftId,
                  message: isExistingProduct 
                    ? `✅ Product already in inventory! Added ${quantityAdded} unit(s). Total: ${result.quantity} (was: ${previousQuantity})`
                    : `🆕 New product discovered! Added to inventory with quantity: ${result.quantity}`
                }
              : item
          )
        )
      } else if (response.status === 404) {
        console.log('Product not found, creating basic product')
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
        
        console.log('Add product response status:', addResponse.status)

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
        const errorText = await response.text()
        console.error('Failed to process product:', response.status, errorText)
        throw new Error(`Failed to process product: ${response.status}`)
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
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Barcode Scanner</h1>
                <p className="text-gray-600 dark:text-gray-300">Scan barcodes to automatically add products to inventory</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <ThemeToggle />
              <Link
                href="/inventory"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <List className="w-4 h-4" />
                <span>View Inventory</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanning Interface */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Scan className="w-5 h-5 mr-2" />
                Scan Product
              </h2>
              
              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Barcode/UPC
                  </label>
                  <input
                    ref={inputRef}
                    id="barcode"
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan or enter barcode..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    disabled={isProcessing}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessing || !barcodeInput.trim()}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Add to Inventory</span>
                    </>
                  )}
                </button>
              </form>

              {/* Stats */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Session Stats</h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Products Scanned:</span>
                    <span className="font-medium">{totalScanned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Items:</span>
                    <span className="font-medium">{recentlyScanned.length}</span>
                  </div>
                </div>
                
                {recentlyScanned.length > 0 && (
                  <button
                    onClick={clearRecentScans}
                    className="w-full mt-3 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Recent Scans</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Recent Scans */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Scans</h2>
              
              {recentlyScanned.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No recent scans</p>
                  <p className="text-sm">Start scanning barcodes to see them here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentlyScanned.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      {/* Product Thumbnail */}
                      {item.imageUrl ? (
                        <div className="flex-shrink-0 w-16 h-16 bg-white dark:bg-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title || 'Product'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                              const icon = document.createElement('div');
                              icon.innerHTML = '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                              e.currentTarget.parentElement?.appendChild(icon);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          {item.status === 'processing' ? (
                            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      {/* Status Icon */}
                      <div className="flex-shrink-0 -ml-2 -mt-1">
                        {getStatusIcon(item.status)}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.title || `UPC: ${item.upc}`}
                        </p>
                        {item.brand && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{item.brand}</p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(item.scannedAt).toLocaleTimeString()}
                          </p>
                          <div className="flex items-center space-x-2">
                            {item.totalQuantity && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Qty: {item.totalQuantity}
                              </span>
                            )}
                            {item.productId && (
                              <Link
                                href={`/products/${item.productId}`}
                                className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                              >
                                View
                              </Link>
                            )}
                            {item.draftId && (
                              <Link
                                href={`/listings/draft/${item.draftId}`}
                                className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                              >
                                Draft
                              </Link>
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
    </div>
  )
}
