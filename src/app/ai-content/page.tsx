'use client'

import React, { useState, useEffect } from 'react'
import { Bot, Sparkles, ArrowLeft, Zap, Eye, EyeOff, Copy, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface AIContent {
  id: string
  productId: string
  seoTitle?: string
  seoDescription?: string
  productDescription?: string
  bulletPoints?: string
  tags?: string
  category?: string
  specifications?: string
  marketingCopy?: string
  // New eBay-focused fields
  ebayTitle?: string
  shortDescription?: string
  uniqueSellingPoints?: string
  keyFeatures?: string
  specificationsArray?: string
  itemSpecifics?: string
  additionalAttributes?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  aiModel?: string
  generatedAt?: string
  processingTime?: number
}

interface ProductWithAI {
  id: string
  upc: string
  title?: string
  brand?: string
  quantity: number
  images: { originalUrl: string }[]
  aiContent?: AIContent
}

interface AISummary {
  total: number
  withAiContent: number
  pending: number
  processing: number
  completed: number
  failed: number
  noContent: number
}

interface GeminiConfig {
  configured: boolean
  primaryModel: string
  fallbackModel: string
}

interface SummaryResponse {
  summary: AISummary
  geminiConfig: GeminiConfig
}

export default function AIContentPage() {
  const [products, setProducts] = useState<ProductWithAI[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string[]>([])
  const [expandedContent, setExpandedContent] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchSummary()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/ai/generate')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching AI summary:', error)
    }
  }

  const generateAIContent = async (productIds: string[], regenerate = false) => {
    setGenerating(prev => [...prev, ...productIds])
    
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, regenerate })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show summary
        const { summary } = result
        if (summary.completed > 0 || summary.errors > 0) {
          alert(`AI Content Generation Complete!\n\nCompleted: ${summary.completed}\nErrors: ${summary.errors}\nSkipped: ${summary.skipped}`)
        }
        
        // Refresh data
        await fetchProducts()
        await fetchSummary()
      } else {
        throw new Error('Failed to generate AI content')
      }
    } catch (error) {
      console.error('Error generating AI content:', error)
      alert('Error generating AI content. Please try again.')
    } finally {
      setGenerating(prev => prev.filter(id => !productIds.includes(id)))
    }
  }

  const generateAllContent = async () => {
    const productsWithoutAI = products.filter(p => !p.aiContent || p.aiContent.status === 'failed')
    if (productsWithoutAI.length === 0) {
      alert('All products already have AI content generated!')
      return
    }

    if (confirm(`Generate AI content for ${productsWithoutAI.length} products?`)) {
      await generateAIContent(productsWithoutAI.map(p => p.id))
    }
  }

  const regenerateContent = async (productId: string) => {
    if (confirm('Regenerate AI content for this product?')) {
      await generateAIContent([productId], true)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getProductImage = (product: ProductWithAI) => {
    return product.images?.[0]?.originalUrl || '/placeholder-product.svg'
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const parseBulletPoints = (bulletPointsJson?: string): string[] => {
    if (!bulletPointsJson) return []
    try {
      return JSON.parse(bulletPointsJson)
    } catch {
      return []
    }
  }

  const parseTags = (tagsJson?: string): string[] => {
    if (!tagsJson) return []
    try {
      return JSON.parse(tagsJson)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI content...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/inventory" className="p-2 text-gray-400 hover:text-purple-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <Bot className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  AI Content Studio
                  <Sparkles className="w-6 h-6 ml-2 text-purple-500" />
                </h1>
                <p className="text-gray-600">Generate SEO-optimized product descriptions with AI</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={generateAllContent}
                disabled={generating.length > 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Generate All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Content Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{summary.summary?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.summary?.completed || 0}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.summary?.processing || 0}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.summary?.failed || 0}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.summary?.noContent || 0}</div>
                <div className="text-sm text-gray-600">No Content</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mt-2">
                  {summary.geminiConfig?.configured ? (
                    <span className="text-green-600">✓ Gemini API</span>
                  ) : (
                    <span className="text-yellow-600">⚠ Mock Mode</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <img
                      src={getProductImage(product)}
                      alt={product.title || `Product ${product.upc}`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.svg'
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {product.title || `UPC: ${product.upc}`}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-600">{product.brand}</p>
                        )}
                        <p className="text-xs text-gray-500">Quantity: {product.quantity}</p>
                      </div>
                      
                      {/* Status and Actions */}
                      <div className="flex items-center space-x-2">
                        {product.aiContent ? (
                          <>
                            {getStatusIcon(product.aiContent.status)}
                            <span className="text-sm text-gray-600 capitalize">
                              {product.aiContent.status}
                            </span>
                            {product.aiContent.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => setExpandedContent(
                                    expandedContent === product.id ? null : product.id
                                  )}
                                  className="p-1 text-gray-400 hover:text-purple-600"
                                >
                                  {expandedContent === product.id ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => regenerateContent(product.id)}
                                  disabled={generating.includes(product.id)}
                                  className="p-1 text-gray-400 hover:text-purple-600 disabled:opacity-50"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => generateAIContent([product.id])}
                            disabled={generating.includes(product.id)}
                            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 text-sm flex items-center space-x-1"
                          >
                            {generating.includes(product.id) ? (
                              <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                <span>Generate</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* AI Content Display */}
                    {expandedContent === product.id && product.aiContent?.status === 'completed' && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* eBay Title */}
                        {product.aiContent.ebayTitle && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm text-gray-700">eBay Title (80 chars)</label>
                              <button
                                onClick={() => copyToClipboard(product.aiContent!.ebayTitle!)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-800">
                              {product.aiContent.ebayTitle}
                              <div className="text-xs text-blue-600 mt-1">{product.aiContent.ebayTitle.length}/80 characters</div>
                            </div>
                          </div>
                        )}

                        {/* SEO Title */}
                        {product.aiContent.seoTitle && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm text-gray-700">SEO Title</label>
                              <button
                                onClick={() => copyToClipboard(product.aiContent!.seoTitle!)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded text-sm text-gray-800">{product.aiContent.seoTitle}</div>
                          </div>
                        )}

                        {/* Short Description */}
                        {product.aiContent.shortDescription && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm text-gray-700">Short Description (150 chars)</label>
                              <button
                                onClick={() => copyToClipboard(product.aiContent!.shortDescription!)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-800">
                              {product.aiContent.shortDescription}
                              <div className="text-xs text-green-600 mt-1">{product.aiContent.shortDescription.length}/150 characters</div>
                            </div>
                          </div>
                        )}

                        {/* Product Description */}
                        {product.aiContent.productDescription && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm text-gray-700">Product Description</label>
                              <button
                                onClick={() => copyToClipboard(product.aiContent!.productDescription!)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-3 bg-white border border-gray-200 rounded text-sm text-gray-800 whitespace-pre-wrap">{product.aiContent.productDescription}</div>
                          </div>
                        )}

                        {/* Unique Selling Points */}
                        {product.aiContent.uniqueSellingPoints && (
                          <div>
                            <label className="font-medium text-sm text-gray-700 mb-2 block">Unique Selling Points</label>
                            <ul className="space-y-1">
                              {parseBulletPoints(product.aiContent.uniqueSellingPoints).map((point, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-800">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 flex-shrink-0"></span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Key Features */}
                        {product.aiContent.keyFeatures && (
                          <div>
                            <label className="font-medium text-sm text-gray-700 mb-2 block">Key Features</label>
                            <ul className="space-y-1">
                              {parseBulletPoints(product.aiContent.keyFeatures).map((point, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-800">
                                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Specifications */}
                        {product.aiContent.specificationsArray && (
                          <div>
                            <label className="font-medium text-sm text-gray-700 mb-2 block">Specifications</label>
                            <ul className="space-y-1">
                              {parseBulletPoints(product.aiContent.specificationsArray).map((spec, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-800">
                                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                                  {spec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Item Specifics */}
                        {product.aiContent.itemSpecifics && (
                          <div>
                            <label className="font-medium text-sm text-gray-700 mb-2 block">Item Specifics</label>
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                              {Object.entries(JSON.parse(product.aiContent.itemSpecifics || '{}')).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm text-gray-800 py-1">
                                  <span className="font-medium">{key}:</span>
                                  <span>{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {product.aiContent.tags && (
                          <div>
                            <label className="font-medium text-sm text-gray-700 mb-2 block">SEO Tags</label>
                            <div className="flex flex-wrap gap-2">
                              {parseTags(product.aiContent.tags).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Marketing Copy */}
                        {product.aiContent.marketingCopy && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="font-medium text-sm text-gray-700">Marketing Copy</label>
                              <button
                                onClick={() => copyToClipboard(product.aiContent!.marketingCopy!)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-sm text-gray-800 whitespace-pre-wrap">
                              {product.aiContent.marketingCopy}
                            </div>
                          </div>
                        )}

                        {/* Generation Info */}
                        <div className="text-xs text-gray-500 pt-2 border-t">
                          Generated {product.aiContent.generatedAt && 
                            new Date(product.aiContent.generatedAt).toLocaleString()
                          } using {product.aiContent.aiModel || 'unknown model'}
                          {product.aiContent.processingTime && 
                            ` (${product.aiContent.processingTime}ms)`
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
