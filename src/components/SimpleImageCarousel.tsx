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
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`}>
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
                className="w-full h-auto object-cover flex-shrink-0"
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
                className="w-full h-auto object-cover flex-shrink-0"
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
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-[#1e3a8a] rounded-full p-1.5 md:p-2 shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-[#1e3a8a]/20"
            aria-label="الصورة السابقة"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-[#1e3a8a] rounded-full p-1.5 md:p-2 shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-[#1e3a8a]/20"
            aria-label="الصورة التالية"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* مؤشرات النقاط */}
          <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {desktopImages.map((_: string, index: number) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-500 rounded-full ${
                  currentIndex === index
                    ? 'bg-white w-8 md:w-10 h-2 shadow-lg'
                    : 'bg-white/60 w-2 h-2 hover:bg-white/90 hover:scale-125'
                }`}
                aria-label={`انتقل إلى الصورة ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
