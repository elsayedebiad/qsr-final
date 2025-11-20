'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import of Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

const ScrollDownIndicatorSimple = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible || !isLoaded) return null

  // يمكنك استبدال هذا بـ animation من LottieFiles
  // مثلاً: https://lottiefiles.com/animations/scroll-down
  const scrollDownAnimation = {
    "v": "5.9.0",
    "fr": 30,
    "ip": 0,
    "op": 90,
    "w": 100,
    "h": 100,
    "nm": "Scroll Down Indicator",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Circle",
        "sr": 1,
        "ks": {
          "o": { "a": 0, "k": 100 },
          "r": { "a": 0, "k": 0 },
          "p": { "a": 0, "k": [50, 40, 0] },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "d": 1,
                "ty": "el",
                "s": { "a": 0, "k": [35, 35] },
                "p": { "a": 0, "k": [0, 0] }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.118, 0.227, 0.541, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 2.5 },
                "lc": 1,
                "lj": 1
              },
              {
                "ty": "tr",
                "p": { "a": 0, "k": [0, 0] },
                "a": { "a": 0, "k": [0, 0] },
                "s": { "a": 0, "k": [100, 100] },
                "r": { "a": 0, "k": 0 },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ]
      },
      {
        "ddd": 0,
        "ind": 2,
        "ty": 4,
        "nm": "Chevron 1",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "t": 0, "s": [0] },
              { "t": 15, "s": [100] },
              { "t": 75, "s": [100] },
              { "t": 90, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "t": 0, "s": [50, 35, 0] },
              { "t": 90, "s": [50, 55, 0] }
            ]
          },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ind": 0,
                "ty": "sh",
                "ks": {
                  "a": 0,
                  "k": {
                    "i": [[0, 0], [0, 0], [0, 0]],
                    "o": [[0, 0], [0, 0], [0, 0]],
                    "v": [[-6, -3], [0, 3], [6, -3]],
                    "c": false
                  }
                }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.118, 0.227, 0.541, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 2.5 },
                "lc": 2,
                "lj": 2
              },
              {
                "ty": "tr",
                "p": { "a": 0, "k": [0, 0] },
                "a": { "a": 0, "k": [0, 0] },
                "s": { "a": 0, "k": [100, 100] },
                "r": { "a": 0, "k": 0 },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ]
      },
      {
        "ddd": 0,
        "ind": 3,
        "ty": 4,
        "nm": "Chevron 2",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "t": 15, "s": [0] },
              { "t": 30, "s": [100] },
              { "t": 75, "s": [100] },
              { "t": 90, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "t": 15, "s": [50, 40, 0] },
              { "t": 90, "s": [50, 60, 0] }
            ]
          },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ind": 0,
                "ty": "sh",
                "ks": {
                  "a": 0,
                  "k": {
                    "i": [[0, 0], [0, 0], [0, 0]],
                    "o": [[0, 0], [0, 0], [0, 0]],
                    "v": [[-6, -3], [0, 3], [6, -3]],
                    "c": false
                  }
                }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.118, 0.227, 0.541, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 2.5 },
                "lc": 2,
                "lj": 2
              },
              {
                "ty": "tr",
                "p": { "a": 0, "k": [0, 0] },
                "a": { "a": 0, "k": [0, 0] },
                "s": { "a": 0, "k": [100, 100] },
                "r": { "a": 0, "k": 0 },
                "o": { "a": 0, "k": 100 }
              }
            ]
          }
        ]
      }
    ]
  }

  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 cursor-pointer select-none"
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
    >
      <div className="flex flex-col items-center gap-2 animate-fadeIn">
        {/* Main Animation Container */}
        <div className="relative group">
          {/* Glowing background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500 scale-150"></div>
          
          {/* Main circle with animation */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-2xl border-2 border-blue-100 group-hover:scale-110 group-hover:shadow-blue-300/50 transition-all duration-300">
            <Lottie 
              animationData={scrollDownAnimation}
              loop={true}
              style={{ width: 60, height: 60 }}
            />
          </div>

          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 animate-ping"></div>
        </div>

        {/* Text label */}
        <div className="relative group-hover:scale-105 transition-transform duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50"></div>
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
            اسحب لأسفل
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ScrollDownIndicatorSimple
