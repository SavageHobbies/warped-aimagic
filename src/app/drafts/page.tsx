'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FileText, Plus, Package, Edit, Send, Trash2, ArrowRight, Search, Filter, Download } from 'lucide-react'

interface Draft {
  id: string
  productId: string
  title: string
  description: string
  price: number
  platform: string
  notes: string
  status?: 'DRAFT' | 'READY' | 'PUBLISHED' | 'ERROR'
  createdAt: string
  updatedAt: string
  product: {
    id: string
    title: string
    upc: string
    brand?: string
    condition?: string
    images: Array<{ originalUrl?: string }>
  } | null
}

export default function DraftsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [filteredDrafts, setFilteredDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('ALL')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })

  useEffect(() => {
    fetchDrafts()
  }, [])

  useEffect(() => {
    // Apply filters whenever drafts or filter criteria change
    applyFilters()
  }, [drafts, searchTerm, platformFilter, priceRange])

  const applyFilters = () => {
    let filtered = [...drafts]
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(draft => 
        draft.title?.toLowerCase().includes(search) ||
        draft.product?.title?.toLowerCase().includes(search) ||
        draft.product?.brand?.toLowerCase().includes(search) ||
        draft.product?.upc?.toLowerCase().includes(search)
      )
    }
    
    // Platform filter
    if (platformFilter && platformFilter !== 'ALL') {
      filtered = filtered.filter(draft => draft.platform === platformFilter)
    }
    
    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(draft => draft.price >= parseFloat(priceRange.min))
    }
    if (priceRange.max) {
      filtered = filtered.filter(draft => draft.price <= parseFloat(priceRange.max))
    }
    
    setFilteredDrafts(filtered)
  }

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/listings/drafts')
      const data = await response.json()
      setDrafts(data.drafts || [])
    } catch (error) {
      console.error('Error fetching drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      const response = await fetch(`/api/listings/drafts/${draftId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId))
        setSelectedDrafts(prev => prev.filter(id => id !== draftId))
      } else {
        console.error('Failed to delete draft')
      }
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedDrafts.length === filteredDrafts.length) {
      setSelectedDrafts([])
    } else {
      setSelectedDrafts(filteredDrafts.map(d => d.id))
    }
  }

  const handleSelectDraft = (draftId: string) => {
    setSelectedDrafts(prev => 
      prev.includes(draftId)
        ? prev.filter(id => id !== draftId)
        : [...prev, draftId]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedDrafts.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedDrafts.length} draft(s)?`)) return

    setBulkActionLoading(true)
    try {
      const deletePromises = selectedDrafts.map(id => 
        fetch(`/api/listings/drafts/${id}`, { method: 'DELETE' })
      )
      
      await Promise.all(deletePromises)
      setDrafts(prev => prev.filter(d => !selectedDrafts.includes(d.id)))
      setSelectedDrafts([])
    } catch (error) {
      console.error('Error deleting drafts:', error)
      alert('Failed to delete some drafts')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedDrafts.length === 0) return
    
    setBulkActionLoading(true)
    try {
      // TODO: Implement CSV export for selected drafts
      alert(`Exporting ${selectedDrafts.length} draft(s) to CSV - feature coming soon!`)
    } catch (error) {
      console.error('Error exporting drafts:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkPublish = async () => {
    if (selectedDrafts.length === 0) return
    
    setBulkActionLoading(true)
    try {
      // TODO: Implement bulk publish functionality
      alert(`Publishing ${selectedDrafts.length} draft(s) - feature coming soon!`)
    } catch (error) {
      console.error('Error publishing drafts:', error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const platformColors: Record<string, string> = {
    EBAY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    AMAZON: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    MERCARI: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  const getStatusBadge = (status?: string) => {
    const statusColors = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      READY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      ERROR: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    
    const displayStatus = status || 'DRAFT'
    const colorClass = statusColors[displayStatus as keyof typeof statusColors] || statusColors.DRAFT
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        {displayStatus}
      </span>
    )
  }

  return (
    <MainLayout
      actions={
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/listings')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Full Listings View
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => router.push('/inventory')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Draft
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Drafts</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your listing drafts</p>
        </div>
        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading drafts...</div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">No drafts found</h3>
            <p className="text-muted-foreground mb-6">
              Start by scanning products and creating eBay drafts from your inventory
            </p>
            <div className="flex justify-center space-x-3">
              <Button 
                variant="outline"
                onClick={() => router.push('/add-product')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Scan Products
              </Button>
              <Button 
                variant="primary"
                onClick={() => router.push('/inventory')}
              >
                <Package className="w-4 h-4 mr-2" />
                View Inventory
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search drafts by title, brand, or UPC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  
                  {/* Platform Filter */}
                  <div className="w-full md:w-40">
                    <select
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="ALL">All Platforms</option>
                      <option value="EBAY">eBay</option>
                      <option value="AMAZON">Amazon</option>
                      <option value="MERCARI">Mercari</option>
                    </select>
                  </div>
                  
                  {/* Price Range */}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-24 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="number"
                      placeholder="Max $"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-24 px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                
                {/* Filter Results Summary */}
                {(searchTerm || platformFilter !== 'ALL' || priceRange.min || priceRange.max) && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Showing {filteredDrafts.length} of {drafts.length} drafts
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('')
                        setPlatformFilter('ALL')
                        setPriceRange({ min: '', max: '' })
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Summary and Bulk Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground">
                      {filteredDrafts.length} Draft{filteredDrafts.length !== 1 ? 's' : ''}
                      {filteredDrafts.length !== drafts.length && (
                        <span className="text-muted-foreground"> (filtered from {drafts.length})</span>
                      )}
                    </h3>
                    <p className="text-muted-foreground">Ready to be published</p>
                  </div>
                  
                  {selectedDrafts.length > 0 && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-muted-foreground">
                        {selectedDrafts.length} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkPublish}
                        disabled={bulkActionLoading}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Publish Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkExport}
                        disabled={bulkActionLoading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={bulkActionLoading}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                      {filteredDrafts.filter(d => d.platform === 'EBAY').length} eBay
                    </span>
                    {filteredDrafts.filter(d => d.platform === 'AMAZON').length > 0 && (
                      <span className="px-3 py-1 text-sm bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded-full">
                        {filteredDrafts.filter(d => d.platform === 'AMAZON').length} Amazon
                      </span>
                    )}
                    {filteredDrafts.filter(d => d.platform === 'MERCARI').length > 0 && (
                      <span className="px-3 py-1 text-sm bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                        {filteredDrafts.filter(d => d.platform === 'MERCARI').length} Mercari
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Drafts Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="p-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedDrafts.length === filteredDrafts.length && filteredDrafts.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-input"
                          />
                        </th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">Product</th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">Price</th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">Platform</th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">Status</th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">Updated</th>
                        <th className="p-3 text-left text-sm font-medium text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrafts.map((draft) => (
                        <tr key={draft.id} className="border-b border-border hover:bg-muted/30" >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedDrafts.includes(draft.id)}
                              onChange={() => handleSelectDraft(draft.id)}
                              className="rounded border-input"
                            />
                          </td>
                          <td className="p-3 cursor-pointer" onClick={() => router.push(`/listings/draft/${draft.id}`)}>
                            <div className="flex items-center space-x-3">
                              {draft.product?.images?.[0]?.originalUrl ? (
                                <img
                                  src={draft.product.images[0].originalUrl}
                                  alt={draft.product.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium text-foreground line-clamp-1">
                                  {draft.title || draft.product?.title || 'Untitled Draft'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {draft.product?.brand || 'No brand'} • {draft.product?.upc || 'No UPC'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">
                              ${draft.price?.toFixed(2) || '0.00'}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              platformColors[draft.platform] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {draft.platform}
                            </span>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(draft.status)}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/listings/draft/${draft.id}`)
                                }}
                                className="p-1 rounded hover:bg-muted"
                                title="Edit draft"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDraft(draft.id)
                                }}
                                className="p-1 rounded hover:bg-muted"
                                title="Delete draft"
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}