'use client'
import { useState, useEffect } from 'react'

export default function AutoScrollIndicatorEnhanced() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY < 100)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
      {/* النص */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full shadow-xl font-bold text-sm whitespace-nowrap">
        اسحب لأعلى لعرض السير
      </div>

      {/* Hand Swipe Animation with CSS */}
      <div className="relative w-20 h-24">
        {/* المسار */}
        <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-gray-300 -translate-x-1/2 rounded-full"></div>
        
        {/* اليد */}
        <div className="absolute left-1/2 -translate-x-1/2 swipe-hand">
          <div className="bg-white border-3 border-blue-600 rounded-full p-2 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 1 1 3 0m-3 6a1.5 1.5 0 0 0-3 0v2a7.5 7.5 0 0 0 15 0v-5a1.5 1.5 0 0 0-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 0 1 3 0v1m0 0V11m0-5.5a1.5 1.5 0 0 1 3 0v3m0 0V11" />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes swipeUp {
          0% {
            bottom: 0;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            bottom: 60px;
            opacity: 0;
          }
        }

        .swipe-hand {
          animation: swipeUp 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
