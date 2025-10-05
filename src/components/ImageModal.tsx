'use client'

import React from 'react'
import { X, Download, ExternalLink } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
  subtitle?: string
}

export default function ImageModal({ isOpen, onClose, imageUrl, title, subtitle }: ImageModalProps) {
  if (!isOpen) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${title}.jpg`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* Header */}
        <div className="bg-card border border-border rounded-t-lg p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="تحميل الصورة"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="فتح في تبويب جديد"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="إغلاق"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="bg-card border-x border-b border-border rounded-b-lg p-4">
          <div className="flex items-center justify-center">
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-image.png' // صورة احتياطية
              }}
            />
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={onClose}
      />
    </div>
  )
}
