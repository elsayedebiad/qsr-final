'use client'

import React, { useState, useEffect } from 'react'

const AutoScrollIndicator = () => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // Hide when user scrolls down 100px
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
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <div className="relative">
        {/* Container with animated skeletons */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-blue-100 p-4 w-64">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full w-3/4 animate-pulse"></div>
              <div className="h-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-1/2 animate-pulse animation-delay-150"></div>
            </div>
          </div>

          {/* Animated skeleton cards moving down and up */}
          <div className="space-y-3 overflow-hidden h-40 relative">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100 animate-scroll-vertical"
                style={{
                  animationDelay: `${index * 0.3}s`,
                  opacity: 0.7 - index * 0.15
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full w-3/4 animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-full animate-pulse animation-delay-100"></div>
                  <div className="h-1.5 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-2/3 animate-pulse animation-delay-200"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Text indicator */}
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse">
              جاري عرض السير الذاتية
            </p>
          </div>
        </div>

        {/* Animated arrow pointing down */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center gap-1 animate-bounce-slow">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping animation-delay-150"></div>
              <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping animation-delay-300"></div>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-2xl -z-10 animate-pulse"></div>
      </div>

      <style jsx>{`
        @keyframes scroll-vertical {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          50% {
            transform: translateY(0);
            opacity: 1;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(120%);
            opacity: 0;
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .animate-scroll-vertical {
          animation: scroll-vertical 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}

export default AutoScrollIndicator
