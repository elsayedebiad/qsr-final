'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SimpleImageCarouselProps {
  desktopImages: string[]
  mobileImages: string[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
}

export default function SimpleImageCarousel({ 
  desktopImages, 
  mobileImages,
  autoPlay = true,
  autoPlayInterval = 3000,
  className = ""
}: SimpleImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || desktopImages.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % desktopImages.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, desktopImages.length, autoPlayInterval])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % desktopImages.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + desktopImages.length) % desktopImages.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (!desktopImages || desktopImages.length === 0) {
    return null
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl ${className}`} style={{ 
      imageRendering: 'high-quality',
      WebkitImageRendering: 'high-quality',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
    }}>
      {/* الصور - PC */}
      {desktopImages.length > 0 && (
        <div className="hidden md:block relative">
          <div 
            className="flex transition-transform duration-700 ease-in-out" 
            style={{ transform: `translateX(${currentIndex * 100}%)` }}
          >
            {desktopImages.map((image: string, index: number) => (
              <img 
                key={index}
                src={image} 
                alt={`صورة ${index + 1}`} 
                className="w-full h-auto object-contain flex-shrink-0"
                style={{ 
                  imageRendering: 'high-quality'
                }}
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-image.png'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* الصور - Mobile */}
      {mobileImages.length > 0 && (
        <div className="block md:hidden relative">
          <div 
            className="flex transition-transform duration-700 ease-in-out" 
            style={{ transform: `translateX(${currentIndex * 100}%)` }}
          >
            {mobileImages.map((image: string, index: number) => (
              <img 
                key={index}
                src={image} 
                alt={`صورة ${index + 1} موبايل`} 
                className="w-full h-auto object-contain flex-shrink-0"
                style={{ 
                  imageRendering: 'high-quality'
                }}
                loading="eager"
                decoding="sync"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-image.png'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* أسهم التنقل */}
      {desktopImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-blue-600/15 backdrop-blur-lg hover:bg-blue-600/25 text-blue-600 rounded-full p-2 md:p-2.5 shadow-2xl transition-all duration-300 hover:scale-105 z-10"
            style={{
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            aria-label="الصورة السابقة"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 drop-shadow-lg" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-blue-600/15 backdrop-blur-lg hover:bg-blue-600/25 text-blue-600 rounded-full p-2 md:p-2.5 shadow-2xl transition-all duration-300 hover:scale-105 z-10"
            style={{
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            aria-label="الصورة التالية"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 drop-shadow-lg" />
          </button>

          {/* مؤشرات النقاط */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {desktopImages.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-500 rounded-full backdrop-blur-md ${
                  currentIndex === index
                    ? 'bg-blue-600/70 w-8 md:w-10 h-2 shadow-lg'
                    : 'bg-blue-600/30 w-2 h-2 hover:bg-blue-600/50 hover:scale-125'
                }`}
                style={{
                  boxShadow: currentIndex === index 
                    ? '0 4px 16px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    : '0 2px 8px rgba(37, 99, 235, 0.2)'
                }}
                aria-label={`انتقل إلى الصورة ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
