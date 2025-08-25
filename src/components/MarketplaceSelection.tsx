'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ShoppingBag, 
  Package, 
  Globe, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  Settings,
  ExternalLink
} from 'lucide-react'

interface Marketplace {
  id: string
  name: string
  displayName: string
  isEnabled: boolean
  apiConfig?: any
  fieldMapping?: any
  templates?: any
  settings?: any
}

interface MarketplaceSelectionProps {
  selectedMarketplaces: string[]
  onSelectionChange: (marketplaces: string[]) => void
  mode?: 'export' | 'publish' | 'template'
  className?: string
}

export default function MarketplaceSelection({
  selectedMarketplaces = [],
  onSelectionChange,
  mode = 'export',
  className = ''
}: MarketplaceSelectionProps) {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [loading, setLoading] = useState(true)
  const [baselinkerStatus, setBaselinkerStatus] = useState<{
    isConfigured: boolean
    isConnected: boolean
  }>({ isConfigured: false, isConnected: false })

  useEffect(() => {
    fetchMarketplaces()
    fetchBaselinkerStatus()
  }, [])

  const fetchMarketplaces = async () => {
    try {
      const response = await fetch('/api/marketplaces')
      const data = await response.json()
      setMarketplaces(data.marketplaces || [])
    } catch (error) {
      console.error('Error fetching marketplaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBaselinkerStatus = async () => {
    try {
      const response = await fetch('/api/baselinker/config')
      const data = await response.json()
      setBaselinkerStatus({
        isConfigured: data.isConfigured,
        isConnected: data.isConnected
      })
    } catch (error) {
      console.error('Error fetching BaseLinker status:', error)
    }
  }

  const handleMarketplaceToggle = (marketplaceName: string) => {
    const updated = selectedMarketplaces.includes(marketplaceName)
      ? selectedMarketplaces.filter(m => m !== marketplaceName)
      : [...selectedMarketplaces, marketplaceName]
    
    onSelectionChange(updated)
  }

  const handleSelectAll = () => {
    const enabledMarketplaces = marketplaces
      .filter(m => m.isEnabled)
      .map(m => m.name)
    onSelectionChange(enabledMarketplaces)
  }

  const handleSelectNone = () => {
    onSelectionChange([])
  }

  const getMarketplaceIcon = (name: string) => {
    switch (name.toUpperCase()) {
      case 'EBAY':
        return <div className="w-6 h-6 bg-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold">eB</div>
      case 'AMAZON':
        return <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">A</div>
      case 'WALMART':
        return <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">W</div>
      case 'FACEBOOK':
        return <div className="w-6 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">f</div>
      case 'BASELINKER':
        return <div className="w-6 h-6 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">BL</div>
      default:
        return <Globe className="w-6 h-6 text-muted-foreground" />
    }
  }

  const getStatusIcon = (marketplace: Marketplace) => {
    if (!marketplace.isEnabled) {
      return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    }

    if (marketplace.name === 'BASELINKER') {
      if (!baselinkerStatus.isConfigured) {
        return <Settings className="w-4 h-4 text-orange-500" />
      }
      if (!baselinkerStatus.isConnected) {
        return <AlertCircle className="w-4 h-4 text-red-500" />
      }
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }

    // For other marketplaces, check if API config exists
    if (marketplace.apiConfig && Object.keys(marketplace.apiConfig).length > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }

    return <Settings className="w-4 h-4 text-orange-500" />
  }

  const getExportTypeIcon = (mode: string) => {
    switch (mode) {
      case 'export':
        return <Download className="w-4 h-4" />
      case 'publish':
        return <Upload className="w-4 h-4" />
      case 'template':
        return <Package className="w-4 h-4" />
      default:
        return <ShoppingBag className="w-4 h-4" />
    }
  }

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'export':
        return 'Select marketplaces to export CSV files for manual import'
      case 'publish':
        return 'Select marketplaces to publish listings directly via API'
      case 'template':
        return 'Select marketplaces to create optimized templates for'
      default:
        return 'Select target marketplaces'
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading marketplaces...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getExportTypeIcon(mode)}
          <span>Select Marketplaces</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getModeDescription(mode)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectNone}
          >
            Select None
          </Button>
        </div>

        {/* Marketplace List */}
        <div className="space-y-2">
          {marketplaces.map((marketplace) => (
            <div
              key={marketplace.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedMarketplaces.includes(marketplace.name)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              } ${!marketplace.isEnabled ? 'opacity-50' : ''}`}
              onClick={() => marketplace.isEnabled && handleMarketplaceToggle(marketplace.name)}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedMarketplaces.includes(marketplace.name)}
                onChange={() => handleMarketplaceToggle(marketplace.name)}
                disabled={!marketplace.isEnabled}
                className="rounded border-input"
              />

              {/* Marketplace Icon */}
              {getMarketplaceIcon(marketplace.name)}

              {/* Marketplace Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-foreground">
                    {marketplace.displayName}
                  </span>
                  {getStatusIcon(marketplace)}
                </div>
                
                {marketplace.name === 'BASELINKER' && !baselinkerStatus.isConfigured && (
                  <p className="text-xs text-orange-600">
                    Configuration required
                  </p>
                )}
                
                {marketplace.name === 'BASELINKER' && baselinkerStatus.isConfigured && !baselinkerStatus.isConnected && (
                  <p className="text-xs text-red-600">
                    Connection failed
                  </p>
                )}

                {!marketplace.isEnabled && (
                  <p className="text-xs text-muted-foreground">
                    Disabled
                  </p>
                )}
              </div>

              {/* Export Format Info */}
              <div className="text-xs text-muted-foreground">
                {mode === 'export' && (
                  <span>CSV</span>
                )}
                {mode === 'publish' && marketplace.name === 'BASELINKER' && (
                  <span>API</span>
                )}
                {mode === 'publish' && marketplace.name !== 'BASELINKER' && (
                  <span>Manual</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedMarketplaces.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>{selectedMarketplaces.length}</strong> marketplace{selectedMarketplaces.length !== 1 ? 's' : ''} selected:
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedMarketplaces.map((name) => {
                const marketplace = marketplaces.find(m => m.name === name)
                return (
                  <span
                    key={name}
                    className="px-2 py-1 text-xs bg-primary/20 text-primary rounded"
                  >
                    {marketplace?.displayName || name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Configuration Links */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Need to configure APIs?</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
            >
              <Settings className="w-4 h-4 mr-1" />
              Settings
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}