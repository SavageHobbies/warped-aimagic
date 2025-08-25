'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Upload, 
  X, 
  Star, 
  StarOff, 
  GripVertical, 
  Camera, 
  AlertCircle,
  RotateCcw
} from 'lucide-react'

interface ImageData {
  id: string
  originalUrl?: string
  url?: string
  altText?: string
  isPrimary: boolean
  imageNumber?: number
}

interface ImageManagerProps {
  images: ImageData[]
  productId?: string
  onImagesChange: (images: ImageData[]) => void
  maxImages?: number
  className?: string
}

export default function ImageManager({
  images = [],
  productId,
  onImagesChange,
  maxImages = 10,
  className = ''
}: ImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)
    const newImages: ImageData[] = []

    Array.from(files).forEach((file, index) => {
      if (images.length + newImages.length >= maxImages) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData: ImageData = {
          id: `temp-${Date.now()}-${index}`,
          originalUrl: e.target?.result as string,
          url: e.target?.result as string,
          altText: file.name,
          isPrimary: images.length === 0 && index === 0,
          imageNumber: images.length + newImages.length + 1
        }
        
        newImages.push(imageData)
        
        if (newImages.length === files.length || images.length + newImages.length >= maxImages) {
          onImagesChange([...images, ...newImages])
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    
    // If removed image was primary, make the first remaining image primary
    if (updatedImages.length > 0) {
      const wasPrimary = images.find(img => img.id === imageId)?.isPrimary
      if (wasPrimary) {
        updatedImages[0] = { ...updatedImages[0], isPrimary: true }
      }
    }
    
    // Renumber images
    const renumberedImages = updatedImages.map((img, index) => ({
      ...img,
      imageNumber: index + 1
    }))
    
    onImagesChange(renumberedImages)
  }

  const handleSetPrimary = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }))
    onImagesChange(updatedImages)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent, dropIndex: number) => {
    event.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const updatedImages = [...images]
    const [draggedImage] = updatedImages.splice(draggedIndex, 1)
    updatedImages.splice(dropIndex, 0, draggedImage)

    // Renumber images
    const renumberedImages = updatedImages.map((img, index) => ({
      ...img,
      imageNumber: index + 1
    }))

    onImagesChange(renumberedImages)
    setDraggedIndex(null)
  }

  const handleRotateImage = async (imageId: string) => {
    // TODO: Implement image rotation
    console.log('Rotate image:', imageId)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Images ({images.length}/{maxImages})
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= maxImages}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Images
          </Button>
        </CardTitle>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {images.length === 0 && (
          <div
            className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">Add Product Images</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop images here, or click to browse
            </p>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative group border rounded-lg overflow-hidden ${
                  image.isPrimary ? 'ring-2 ring-primary' : 'border-border'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Image */}
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {image.originalUrl || image.url ? (
                    <img
                      src={image.originalUrl || image.url}
                      alt={image.altText || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Primary
                    </span>
                  </div>
                )}

                {/* Image Number */}
                <div className="absolute top-2 right-2">
                  <span className="bg-background/80 text-foreground text-xs px-2 py-1 rounded-full">
                    {index + 1}
                  </span>
                </div>

                {/* Action Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    {/* Drag Handle */}
                    <button
                      className="p-2 bg-background/80 rounded-full hover:bg-background"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>

                    {/* Set Primary */}
                    {!image.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(image.id)}
                        className="p-2 bg-background/80 rounded-full hover:bg-background"
                        title="Set as primary image"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Rotate */}
                    <button
                      onClick={() => handleRotateImage(image.id)}
                      className="p-2 bg-background/80 rounded-full hover:bg-background"
                      title="Rotate image"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="p-2 bg-red-500/80 rounded-full hover:bg-red-500"
                      title="Remove image"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <div
                className="aspect-square border-2 border-dashed border-muted rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add More</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guidelines */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-foreground mb-2">Image Guidelines</h4>
              <ul className="text-muted-foreground space-y-1">
                <li>• First image will be used as the main listing image</li>
                <li>• Maximum {maxImages} images per listing</li>
                <li>• Supported formats: JPG, PNG, GIF</li>
                <li>• Recommended size: 1200x1200 pixels or larger</li>
                <li>• Images should clearly show the product</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploading && (
          <div className="text-center py-4">
            <div className="text-muted-foreground">Uploading images...</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}