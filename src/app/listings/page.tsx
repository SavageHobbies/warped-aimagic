'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Package, Plus, FileText, Upload, Send, Trash2, Edit, DollarSign } from 'lucide-react'

interface ListingDraft {
  id: string
  productId: string
  marketplace: string
  status: string
  price: string
  quantity: number
  ebayListingId?: string
  createdAt: string
  updatedAt: string
  product: {
    id: string
    title: string
    upc: string
    brand?: string
    condition: string
    images: Array<{ originalUrl?: string }>
  }
}

export default function ListingsPage() {
  const router = useRouter()
  const [drafts, setDrafts] = useState<ListingDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchDrafts()
  }, [statusFilter])

  const fetchDrafts = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/listings/drafts?${params}`)
      const data = await response.json()
      setDrafts(data.drafts || [])
    } catch (error) {
      console.error('Error fetching drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedDrafts.length === drafts.length) {
      setSelectedDrafts([])
    } else {
      setSelectedDrafts(drafts.map(d => d.id))
    }
  }

  const handleSelect = (id: string) => {
    setSelectedDrafts(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedDrafts.length === 0) return

    try {
      const response = await fetch('/api/listings/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedDrafts,
          updates: { status: newStatus }
        })
      })

      if (response.ok) {
        fetchDrafts()
        setSelectedDrafts([])
      }
    } catch (error) {
      console.error('Error updating drafts:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      ready: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      publishing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.draft}`}>
        {status}
      </span>
    )
  }

  return (
    <MainLayout
      title="Listings"
      subtitle="Manage your product listings and drafts"
      icon={<List className="w-8 h-8 text-primary" />}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Draft
          </Button>
        </div>
      }
    >
      <div className="p-6">
        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="publishing">Publishing</option>
                  <option value="published">Published</option>
                  <option value="error">Error</option>
                  <option value="archived">Archived</option>
                </select>

                {selectedDrafts.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedDrafts.length} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('ready')}
                    >
                      Mark Ready
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusUpdate('archived')}
                    >
                      Archive
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drafts Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading drafts...
              </div>
            ) : drafts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No drafts found</p>
                <Button variant="primary" onClick={() => router.push('/scanner')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Scan Products
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
                          checked={selectedDrafts.length === drafts.length}
                          onChange={handleSelectAll}
                          className="rounded border-input"
                        />
                      </th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Product</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Price</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Qty</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Condition</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Status</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Updated</th>
                      <th className="p-3 text-left text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((draft) => (
                      <tr key={draft.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedDrafts.includes(draft.id)}
                            onChange={() => handleSelect(draft.id)}
                            className="rounded border-input"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-3">
                            {draft.product.images?.[0]?.originalUrl ? (
                              <img
                                src={draft.product.images[0].originalUrl}
                                alt={draft.product.title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-foreground line-clamp-1">
                                {draft.product.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {draft.product.brand} • {draft.product.upc}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-foreground">
                            ${parseFloat(draft.price).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 text-foreground">{draft.quantity}</td>
                        <td className="p-3 text-foreground">{draft.product.condition}</td>
                        <td className="p-3">{getStatusBadge(draft.status)}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(draft.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/listings/draft/${draft.id}`)}
                              className="p-1 rounded hover:bg-muted"
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {draft.status === 'ready' && (
                              <button className="p-1 rounded hover:bg-muted">
                                <Send className="w-4 h-4 text-muted-foreground" />
                              </button>
                            )}
                            <button className="p-1 rounded hover:bg-muted">
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
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
    </MainLayout>
  )
}

// Fix for missing List import
import { List } from 'lucide-react'
