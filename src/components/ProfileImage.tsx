import React, { useState } from 'react'
import { User } from 'lucide-react'
import { getOptimizedImageUrl } from '@/lib/google-drive-utils'
import ImageModal from './ImageModal'

interface ProfileImageProps {
  src?: string | null
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: React.ReactNode
  clickable?: boolean
  title?: string
  subtitle?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10', 
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8', 
  xl: 'h-12 w-12'
}

export default function ProfileImage({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  fallbackIcon,
  clickable = false,
  title,
  subtitle
}: ProfileImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  const optimizedImageUrl = getOptimizedImageUrl(src)
  const shouldShowImage = optimizedImageUrl && !imageError
  
  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }
  
  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleClick = () => {
    if (clickable && optimizedImageUrl && !imageError) {
      setShowModal(true)
    }
  }

  return (
    <>
      <div 
        className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${className} ${
          clickable && shouldShowImage ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
        onClick={handleClick}
      >
        {shouldShowImage ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
            )}
            <img
              className={`${sizeClasses[size]} rounded-full object-cover border border-border transition-opacity duration-200 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              src={optimizedImageUrl}
              alt={alt}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : (
          <div className={`${sizeClasses[size]} rounded-full bg-muted flex items-center justify-center border border-border`}>
            {fallbackIcon || <User className={`${iconSizes[size]} text-muted-foreground`} />}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showModal && optimizedImageUrl && (
        <ImageModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          imageUrl={optimizedImageUrl}
          title={title || alt}
          subtitle={subtitle}
        />
      )}
    </>
  )
}
