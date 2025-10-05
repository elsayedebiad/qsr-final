'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Star, MessageCircle } from 'lucide-react'
import { getOptimizedImageUrl } from '@/lib/google-drive-utils'

interface FeaturedWorker {
  id: string
  fullName: string
  nationality?: string
  position?: string
  profileImage?: string
  referenceCode?: string
  age?: number
  experience?: string
}

interface FeaturedWorkersCarouselProps {
  workers: FeaturedWorker[]
  onContactWorker?: (worker: FeaturedWorker) => void
  title?: string
  autoPlay?: boolean
  autoPlayInterval?: number
}

export default function FeaturedWorkersCarousel({ 
  workers, 
  onContactWorker,
  title = "العمال المميزون",
  autoPlay = true,
  autoPlayInterval = 4000
}: FeaturedWorkersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || workers.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % workers.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, workers.length, isHovered, autoPlayInterval])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % workers.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + workers.length) % workers.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // دالة تحويل الجنسية للعربي
  const getNationalityArabic = (nationality: string | null | undefined): string => {
    if (!nationality) return 'غير محدد'
    
    const nationalityArabicMap: { [key: string]: string } = {
      'FILIPINO': 'الفلبين',
      'INDIAN': 'الهند',
      'BANGLADESHI': 'بنغلاديش',
      'ETHIOPIAN': 'إثيوبيا',
      'KENYAN': 'كينيا',
      'UGANDAN': 'أوغندا',
      'SRI_LANKAN': 'سريلانكا'
    }
    
    return nationalityArabicMap[nationality] || nationality
  }

  if (!workers || workers.length === 0) {
    return null
  }

  // عرض 3 عمال في المرة الواحدة على الشاشات الكبيرة، 2 على المتوسطة، 1 على الصغيرة
  const getVisibleWorkers = () => {
    const visibleCount = 3 // يمكن تعديل هذا حسب الحاجة
    const result = []
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % workers.length
      result.push(workers[index])
    }
    
    return result
  }

  const visibleWorkers = getVisibleWorkers()

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 rounded-2xl shadow-lg">
      {/* العنوان */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mb-2 flex items-center justify-center gap-2">
          <Star className="h-6 w-6 text-yellow-500 fill-current" />
          {title}
          <Star className="h-6 w-6 text-yellow-500 fill-current" />
        </h2>
        <p className="text-gray-600">اختر من بين أفضل العمال المتاحين</p>
      </div>

      {/* الكاروسل */}
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* المحتوى الرئيسي */}
        <div className="overflow-hidden rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleWorkers.map((worker, index) => (
              <div
                key={`${worker.id}-${currentIndex}-${index}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-xl"
              >
                {/* صورة العامل */}
                <div className="relative h-48 md:h-56 overflow-hidden">
                  {worker.profileImage ? (
                    <img
                      src={getOptimizedImageUrl(worker.profileImage) || worker.profileImage}
                      alt={worker.fullName}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-worker.png' // صورة احتياطية
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {worker.fullName.charAt(0)}
                          </span>
                        </div>
                        <p className="text-sm">لا توجد صورة</p>
                      </div>
                    </div>
                  )}
                  
                  {/* شارة مميز */}
                  <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    مميز
                  </div>
                </div>

                {/* معلومات العامل */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">
                    {worker.fullName}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {worker.nationality && (
                      <div className="flex items-center justify-between">
                        <span>الجنسية:</span>
                        <span className="font-medium">{getNationalityArabic(worker.nationality)}</span>
                      </div>
                    )}
                    
                    {worker.position && (
                      <div className="flex items-center justify-between">
                        <span>الوظيفة:</span>
                        <span className="font-medium">{worker.position}</span>
                      </div>
                    )}
                    
                    {worker.age && (
                      <div className="flex items-center justify-between">
                        <span>العمر:</span>
                        <span className="font-medium">{worker.age} سنة</span>
                      </div>
                    )}
                    
                    {worker.referenceCode && (
                      <div className="flex items-center justify-between">
                        <span>الكود:</span>
                        <span className="font-medium text-blue-600">{worker.referenceCode}</span>
                      </div>
                    )}
                  </div>

                  {/* زر التواصل */}
                  {onContactWorker && (
                    <button
                      onClick={() => onContactWorker(worker)}
                      className="w-full bg-gradient-to-r from-[#25d366] to-[#1fb855] hover:from-[#1fb855] hover:to-[#25d366] text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <MessageCircle className="h-4 w-4" />
                      تواصل معنا
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* أسهم التنقل */}
        {workers.length > 3 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-[#1e3a8a] rounded-full p-2 shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-[#1e3a8a]/20"
              aria-label="العامل السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-[#1e3a8a] rounded-full p-2 shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-[#1e3a8a]/20"
              aria-label="العامل التالي"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}

        {/* مؤشرات النقاط */}
        {workers.length > 3 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.ceil(workers.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index * 3)}
                className={`transition-all duration-300 rounded-full ${
                  Math.floor(currentIndex / 3) === index
                    ? 'bg-[#1e3a8a] w-8 h-2 shadow-lg'
                    : 'bg-gray-300 w-2 h-2 hover:bg-gray-400 hover:scale-125'
                }`}
                aria-label={`انتقل إلى المجموعة ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
