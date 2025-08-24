'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import MarketplaceSelection from './MarketplaceSelection'
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Globe, 
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface MultiMarketplaceExportModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProductIds: string[]
  totalProducts: number
  onExport: (options: ExportOptions) => Promise<void>
}

interface ExportOptions {
  type: 'csv' | 'api' | 'baselinker'
  marketplaces: string[]
  scope: 'selected' | 'all' | 'filtered'
  productIds?: string[]
  customFields?: string[]
}

export default function MultiMarketplaceExportModal({
  isOpen,
  onClose,
  selectedProductIds,
  totalProducts,
  onExport
}: MultiMarketplaceExportModalProps) {
  const [exportType, setExportType] = useState<'csv' | 'api' | 'baselinker'>('csv')
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([])
  const [exportScope, setExportScope] = useState<'selected' | 'all' | 'filtered'>('selected')
  const [customFields, setCustomFields] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (!isOpen) return null

  const handleExport = async () => {
    if (selectedMarketplaces.length === 0) {
      alert('Please select at least one marketplace')
      return
    }

    if (exportScope === 'selected' && selectedProductIds.length === 0) {
      alert('No products selected')
      return
    }

    setIsExporting(true)

    try {
      const options: ExportOptions = {
        type: exportType,
        marketplaces: selectedMarketplaces,
        scope: exportScope,
        productIds: exportScope === 'selected' ? selectedProductIds : undefined,
        customFields: customFields.length > 0 ? customFields : undefined
      }

      await onExport(options)
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getExportTypeDescription = (type: string) => {
    switch (type) {
      case 'csv':
        return 'Download CSV files optimized for each marketplace. Use for manual uploads to marketplace platforms.'
      case 'api':
        return 'Publish directly to supported marketplaces via API integration. Instant listing creation.'
      case 'baselinker':
        return 'Sync products to BaseLinker inventory management system for unified marketplace management.'
      default:
        return ''
    }
  }

  const getProductCountText = () => {
    switch (exportScope) {
      case 'selected':
        return `${selectedProductIds.length} selected product${selectedProductIds.length !== 1 ? 's' : ''}`
      case 'all':
        return `All ${totalProducts} products`
      case 'filtered':
        return 'Filtered products'
      default:
        return ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Export Products</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Export products to multiple marketplaces
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Export Type & Scope */}
            <div className="space-y-6">
              {/* Export Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* CSV Export */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      exportType === 'csv' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setExportType('csv')}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={exportType === 'csv'}
                        onChange={() => setExportType('csv')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">CSV Export</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getExportTypeDescription('csv')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* API Publishing */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      exportType === 'api' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setExportType('api')}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={exportType === 'api'}
                        onChange={() => setExportType('api')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-5 h-5 text-green-600" />
                          <span className="font-medium">API Publishing</span>
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            Limited
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getExportTypeDescription('api')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BaseLinker Sync */}
                  <div 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      exportType === 'baselinker' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setExportType('baselinker')}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        checked={exportType === 'baselinker'}
                        onChange={() => setExportType('baselinker')}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Upload className="w-5 h-5 text-purple-600" />
                          <span className="font-medium">BaseLinker Sync</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getExportTypeDescription('baselinker')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Scope */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={exportScope === 'selected'}
                        onChange={() => setExportScope('selected')}
                        disabled={selectedProductIds.length === 0}
                      />
                      <span>Selected products ({selectedProductIds.length})</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={exportScope === 'all'}
                        onChange={() => setExportScope('all')}
                      />
                      <span>All products ({totalProducts})</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        checked={exportScope === 'filtered'}
                        onChange={() => setExportScope('filtered')}
                      />
                      <span>Currently filtered products</span>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Options */}
              {exportType === 'csv' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showAdvanced}
                          onChange={(e) => setShowAdvanced(e.target.checked)}
                        />
                        <span className="text-sm">Custom field selection</span>
                      </label>
                      
                      {showAdvanced && (
                        <div className="mt-3 p-3 border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">
                            Select custom fields to include in export:
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {['title', 'description', 'price', 'quantity', 'condition', 'brand', 'model', 'color', 'size', 'weight', 'dimensions'].map(field => (
                              <label key={field} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={customFields.includes(field)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setCustomFields([...customFields, field])
                                    } else {
                                      setCustomFields(customFields.filter(f => f !== field))
                                    }
                                  }}
                                />
                                <span className="capitalize">{field}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Marketplace Selection */}
            <div>
              <MarketplaceSelection
                selectedMarketplaces={selectedMarketplaces}
                onSelectionChange={setSelectedMarketplaces}
                mode={exportType === 'csv' ? 'export' : exportType === 'api' ? 'publish' : 'export'}
                className="h-fit"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {selectedMarketplaces.length > 0 && (
              <span>
                Exporting {getProductCountText()} to {selectedMarketplaces.length} marketplace{selectedMarketplaces.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || selectedMarketplaces.length === 0}
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 mr-2 border border-current border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}