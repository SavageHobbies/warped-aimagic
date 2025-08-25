'use client'

import React, { useState, useRef } from 'react'
import MainLayout from '@/components/MainLayout'
import { Scan, ArrowRight, ArrowLeft, Camera, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ScanProductPage() {
  const [upc, setUpc] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleUpcSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!upc.trim()) return

    setIsScanning(true)
    try {
      // Simulate product lookup
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // For demo purposes, redirect to product details step
      router.push(`/add-product/details?upc=${upc}&method=scan`)
    } catch (error) {
      console.error('Error looking up product:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const simulateCamera = () => {
    // In a real app, this would open camera
    alert('Camera functionality would be implemented here. For demo, please enter UPC manually.')
    inputRef.current?.focus()
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Scan Product</h1>
          <p className="text-sm text-muted-foreground mt-1">Step 1 of 6 - Product Identification</p>
        </div>
        <div className="max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-sm font-medium text-blue-600">Identify Product</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-sm text-gray-500">Product Details</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-sm text-gray-500">Condition & Photos</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/add-product"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                Step 1
              </div>
              <div className="text-sm text-gray-500">17% Complete</div>
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scan className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                UPC/Barcode Scanner
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Enter or scan the UPC/barcode to automatically identify your product
              </p>
            </div>

            {/* UPC Input */}
            <div className="max-w-2xl mx-auto space-y-6">
              <form onSubmit={handleUpcSubmit} className="space-y-6">
                <div>
                  <label htmlFor="upc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    UPC/Barcode
                  </label>
                  <input
                    ref={inputRef}
                    id="upc"
                    type="text"
                    value={upc}
                    onChange={(e) => setUpc(e.target.value)}
                    placeholder="Enter UPC code (e.g., 123456789012)"
                    className="w-full px-4 py-4 text-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                    disabled={isScanning}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isScanning || !upc.trim()}
                  className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-colors"
                >
                  {isScanning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Looking up product...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Continue to Product Details</span>
                    </>
                  )}
                </button>
              </form>

              {/* Camera Scanner */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={simulateCamera}
                className="w-full px-6 py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center space-x-3"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Camera Scanner (Simulated)</div>
                  <div className="text-sm text-gray-500">In a real app, you would use the camera to scan barcodes directly</div>
                </div>
              </button>

              {/* Helper Text */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Tips for better results:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Make sure the barcode is clean and undamaged</li>
                  <li>• UPC codes are typically 12 digits long</li>
                  <li>• EAN codes are typically 13 digits long</li>
                  <li>• If scanning fails, try entering the code manually</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
