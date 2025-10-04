'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BannerCarouselProps {
  salesPageId: string
  className?: string
}

export default function BannerCarousel({ salesPageId, className = '' }: BannerCarouselProps) {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const [desktopBanners, setDesktopBanners] = useState<string[]>([])
  const [mobileBanners, setMobileBanners] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // جلب البنرات من API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/banners?salesPageId=${salesPageId}`)
        if (response.ok) {
          const banners = await response.json()
          
          // فصل البنرات حسب نوع الجهاز (المفعلة فقط)
          const activeBanners = banners.filter((b: any) => b.isActive)
          const desktop = activeBanners
            .filter((b: any) => b.deviceType === 'DESKTOP')
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl)
          const mobile = activeBanners
            .filter((b: any) => b.deviceType === 'MOBILE')
            .sort((a: any, b: any) => a.order - b.order)
            .map((b: any) => b.imageUrl)
          
          setDesktopBanners(desktop.length > 0 ? desktop : ['/bannar one.png', '/bannar two.png'])
          setMobileBanners(mobile.length > 0 ? mobile : ['/bannar one mobile.png', '/bannar two mobile.png'])
        } else {
          // استخدام البنرات الافتراضية في حال فشل التحميل
          setDesktopBanners(['/bannar one.png', '/bannar two.png'])
          setMobileBanners(['/bannar one mobile.png', '/bannar two mobile.png'])
        }
      } catch (error) {
        console.error('Error fetching banners:', error)
        // استخدام البنرات الافتراضية
        setDesktopBanners(['/bannar one.png', '/bannar two.png'])
        setMobileBanners(['/bannar one mobile.png', '/bannar two mobile.png'])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBanners()
  }, [salesPageId])

  // Auto-play للـCarousel
  useEffect(() => {
    if (desktopBanners.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % desktopBanners.length)
    }, 2000) // كل 2 ثانية

    return () => clearInterval(interval)
  }, [desktopBanners.length])

  if (isLoading || (desktopBanners.length === 0 && mobileBanners.length === 0)) {
    return null
  }

  return (
    <div className={`mb-6 relative ${className}`}>
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        {/* البنرات - PC */}
        {desktopBanners.length > 0 && (
          <div className="hidden md:block relative">
            <div 
              className="flex transition-transform duration-700 ease-in-out" 
              style={{ transform: `translateX(${currentBannerIndex * 100}%)` }}
            >
              {desktopBanners.map((banner, index) => (
                <img 
                  key={index}
                  src={banner} 
                  alt={`Banner ${index + 1}`} 
                  className="w-full h-auto object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* البنرات - Mobile */}
        {mobileBanners.length > 0 && (
          <div className="block md:hidden relative">
            <div 
              className="flex transition-transform duration-700 ease-in-out" 
              style={{ transform: `translateX(${currentBannerIndex * 100}%)` }}
            >
              {mobileBanners.map((banner, index) => (
                <img 
                  key={index}
                  src={banner} 
                  alt={`Banner ${index + 1} Mobile`} 
                  className="w-full h-auto object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* أسهم التنقل - ظاهرة دائماً */}
        {desktopBanners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + desktopBanners.length) % desktopBanners.length)}
              className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-[#1e3a8a] rounded-full p-1.5 md:p-2 shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-[#1e3a8a]/20"
              aria-label="البنر السابق"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            <button
              onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % desktopBanners.length)}
              className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-[#1e3a8a] rounded-full p-1.5 md:p-2 shadow-xl transition-all duration-300 hover:scale-110 z-10 border border-[#1e3a8a]/20"
              aria-label="البنر التالي"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* مؤشرات النقاط */}
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {desktopBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`transition-all duration-500 rounded-full ${
                    currentBannerIndex === index
                      ? 'bg-white w-8 md:w-10 h-2 shadow-lg'
                      : 'bg-white/60 w-2 h-2 hover:bg-white/90 hover:scale-125'
                  }`}
                  aria-label={`انتقل إلى البنر ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

