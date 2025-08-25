'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Eye, 
  Monitor, 
  Smartphone, 
  ExternalLink,
  Star,
  Heart,
  ShoppingCart,
  MessageCircle,
  Share2,
  Clock
} from 'lucide-react'

interface PreviewData {
  title: string
  description: string
  price: number
  platform: string
  brand?: string
  condition?: string
  images: Array<{ originalUrl?: string; url?: string; altText?: string }>
  ebayCategory?: string
  listingFormat?: string
  duration?: string
  quantity?: number
}

interface ListingPreviewProps {
  data: PreviewData
  className?: string
}

export default function ListingPreview({ data, className = '' }: ListingPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [selectedImage, setSelectedImage] = useState(0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  const renderEbayPreview = () => (
    <div className={`bg-white border rounded-lg overflow-hidden ${
      viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
    }`}>
      {/* eBay Header */}
      <div className="bg-blue-600 text-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">eBay</span>
            </div>
            <span className="font-medium">Listing Preview</span>
          </div>
          {viewMode === 'desktop' && (
            <div className="flex items-center space-x-4">
              <Heart className="w-5 h-5" />
              <Share2 className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Images */}
        <div className="mb-4">
          {data.images.length > 0 ? (
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <img
                  src={data.images[selectedImage]?.originalUrl || data.images[selectedImage]?.url}
                  alt={data.images[selectedImage]?.altText || `Product image ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {data.images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto">
                  {data.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                        selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.originalUrl || image.url}
                        alt={image.altText || `Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {data.title || 'Untitled Listing'}
        </h1>

        {/* Price and Actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {formatPrice(data.price || 0)}
            </div>
            {data.listingFormat === 'Auction' && (
              <div className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                {data.duration}d remaining
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="w-4 h-4 mr-1" />
              {data.listingFormat === 'Auction' ? 'Bid' : 'Buy It Now'}
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Condition and Details */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Condition:</span>
            <span className="font-medium">{data.condition || 'New'}</span>
          </div>
          {data.brand && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Brand:</span>
              <span className="font-medium">{data.brand}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantity:</span>
            <span className="font-medium">{data.quantity || 1} available</span>
          </div>
          {data.ebayCategory && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium text-blue-600">{data.ebayCategory}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {data.description && (
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Item Description</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
              {data.description}
            </div>
          </div>
        )}

        {/* Seller Info */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div>
              <div className="font-medium text-sm">seller_username</div>
              <div className="flex items-center text-xs text-gray-600">
                <Star className="w-3 h-3 text-yellow-400 mr-1" />
                <span>99.1% positive feedback</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAmazonPreview = () => (
    <div className={`bg-white border rounded-lg overflow-hidden ${
      viewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
    }`}>
      {/* Amazon Header */}
      <div className="bg-gray-900 text-white p-3">
        <div className="flex items-center space-x-2">
          <div className="text-orange-400 font-bold">amazon</div>
          <span className="text-gray-300">|</span>
          <span className="text-sm">Listing Preview</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Images */}
        <div className="mb-4">
          {data.images.length > 0 ? (
            <div className="aspect-square bg-white border rounded-lg overflow-hidden">
              <img
                src={data.images[selectedImage]?.originalUrl || data.images[selectedImage]?.url}
                alt={data.images[selectedImage]?.altText || `Product image ${selectedImage + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-normal text-gray-900 mb-2 line-clamp-3">
          {data.title || 'Untitled Product'}
        </h1>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 text-orange-400 fill-current" />
            ))}
          </div>
          <span className="text-sm text-blue-600">4.5 out of 5 stars</span>
          <span className="text-sm text-gray-600">(123 reviews)</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="text-2xl font-normal text-red-700">
            {formatPrice(data.price || 0)}
          </div>
          <div className="text-sm text-gray-600">
            FREE delivery by Amazon
          </div>
        </div>

        {/* Prime Badge */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
            Prime
          </div>
          <span className="text-sm text-gray-600">FREE One-Day Delivery</span>
        </div>

        {/* Availability */}
        <div className="text-green-700 text-sm font-medium mb-4">
          In Stock
        </div>

        {/* Add to Cart */}
        <div className="space-y-2">
          <Button className="w-full bg-orange-400 hover:bg-orange-500 text-black">
            Add to Cart
          </Button>
          <Button variant="outline" className="w-full">
            Buy Now
          </Button>
        </div>

        {/* Product Details */}
        <div className="border-t pt-4 mt-4 space-y-2">
          {data.brand && (
            <div className="text-sm">
              <span className="text-gray-600">Brand: </span>
              <span className="text-blue-600">{data.brand}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-gray-600">Condition: </span>
            <span>{data.condition || 'New'}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPreview = () => {
    switch (data.platform?.toUpperCase()) {
      case 'AMAZON':
        return renderAmazonPreview()
      case 'EBAY':
      default:
        return renderEbayPreview()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Listing Preview - {data.platform?.toUpperCase() || 'eBay'}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'desktop' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-4 h-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-4 h-4 mr-1" />
              Mobile
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          {renderPreview()}
        </div>
        
        {/* Preview Notes */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            <strong>Note:</strong> This is a preview of how your listing might appear. 
            Actual appearance may vary based on marketplace updates and user settings.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}