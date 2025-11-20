'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const ScrollDownIndicator = () => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // Hide the indicator when user scrolls down 100px
      if (window.scrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center animate-bounce cursor-pointer"
         onClick={() => window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' })}>
      <div className="bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg border border-gray-200">
        <ChevronDown className="h-6 w-6 text-[#1e3a8a] animate-pulse" />
      </div>
      <p className="mt-2 text-sm font-medium text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
        اسحب لأسفل لعرض السير
      </p>
    </div>
  )
}

export default ScrollDownIndicator