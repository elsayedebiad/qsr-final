'use client'

import React, { useState, useEffect } from 'react'
import Lottie from 'lottie-react'

const ScrollDownIndicatorAdvanced = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxScroll = 100
      
      if (scrolled > maxScroll) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
        setScrollProgress((scrolled / maxScroll) * 100)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  // Enhanced Lottie animation with mouse cursor
  const scrollAnimationWithMouse = {
    "v": "5.7.4",
    "fr": 60,
    "ip": 0,
    "op": 180,
    "w": 120,
    "h": 120,
    "nm": "Scroll Mouse",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Mouse Body",
        "sr": 1,
        "ks": {
          "o": { "a": 0, "k": 100 },
          "r": { "a": 0, "k": 0 },
          "p": { "a": 0, "k": [60, 45, 0] },
          "a": { "a": 0, "k": [0, 0, 0] },
          "s": { "a": 0, "k": [100, 100, 100] }
        },
        "ao": 0,
        "shapes": [
          {
            "ty": "gr",
            "it": [
              {
                "ty": "rc",
                "d": 1,
                "s": { "a": 0, "k": [30, 45] },
                "p": { "a": 0, "k": [0, 0] },
                "r": { "a": 0, "k": 15 }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.118, 0.227, 0.541, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 3 },
                "lc": 2,
                "lj": 2
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [1, 1, 1, 0.1] },
                "o": { "a": 0, "k": 100 }
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
        "nm": "Scroll Wheel",
        "sr": 1,
        "ks": {
          "o": { "a": 0, "k": 100 },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 0, "s": [60, 35, 0], "to": [0, 3, 0], "ti": [0, -3, 0] },
              { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 90, "s": [60, 53, 0], "to": [0, 0, 0], "ti": [0, 0, 0] },
              { "t": 180, "s": [60, 35, 0] }
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
                "ty": "rc",
                "d": 1,
                "s": { "a": 0, "k": [4, 8] },
                "p": { "a": 0, "k": [0, 0] },
                "r": { "a": 0, "k": 2 }
              },
              {
                "ty": "fl",
                "c": { "a": 0, "k": [0.118, 0.227, 0.541, 1] },
                "o": { "a": 0, "k": 100 }
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
        "nm": "Arrow Down",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 0, "s": [0] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 30, "s": [100] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 150, "s": [100] },
              { "t": 180, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 0, "s": [60, 75, 0], "to": [0, 5, 0], "ti": [0, -5, 0] },
              { "t": 180, "s": [60, 105, 0] }
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
                    "v": [[-10, -6], [0, 6], [10, -6]],
                    "c": false
                  }
                }
              },
              {
                "ty": "st",
                "c": { "a": 0, "k": [0.118, 0.227, 0.541, 1] },
                "o": { "a": 0, "k": 100 },
                "w": { "a": 0, "k": 3 },
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
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center cursor-pointer"
      onClick={() => window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' })}
    >
      {/* Main container with multiple layers */}
      <div className="relative group">
        {/* Outer glow ring - animated */}
        <div className="absolute inset-0 -m-4">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-30 blur-xl animate-pulse"></div>
        </div>

        {/* Middle ring - rotating gradient */}
        <div className="absolute inset-0 -m-2">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-lg animate-spin-slow"></div>
        </div>

        {/* Main container */}
        <div className="relative bg-gradient-to-br from-white via-blue-50 to-purple-50 backdrop-blur-xl rounded-full p-5 shadow-2xl border-2 border-white/80 group-hover:scale-110 transition-all duration-500 ease-out">
          {/* Inner shadow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-50"></div>
          
          {/* Progress ring */}
          <svg className="absolute inset-0 -m-1 transform -rotate-90" width="100%" height="100%">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeDasharray={`${scrollProgress * 2.83} 283`}
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Lottie Animation */}
          <div className="relative z-10">
            <Lottie 
              animationData={scrollAnimationWithMouse}
              loop={true}
              className="w-20 h-20"
            />
          </div>
        </div>

        {/* Sparkle effects */}
        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-75"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 bg-pink-300 rounded-full animate-ping opacity-75 animation-delay-150"></div>
        <div className="absolute top-1/2 right-0 w-2 h-2 bg-blue-300 rounded-full animate-ping opacity-75 animation-delay-300"></div>
      </div>

      {/* Enhanced Text */}
      <div className="mt-4 relative">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-all duration-300 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-full blur-md opacity-40 animate-pulse animation-delay-150"></div>
        
        {/* Text content */}
        <div className="relative">
          <p className="text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-sm border border-white/30 whitespace-nowrap group-hover:shadow-purple-500/50 transition-all duration-300">
            <span className="relative inline-flex items-center gap-2">
              <span className="animate-pulse">✨</span>
              اسحب لأسفل لعرض السير
              <span className="animate-pulse animation-delay-150">✨</span>
            </span>
          </p>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce opacity-60"></div>
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce opacity-60 animation-delay-150"></div>
        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-bounce opacity-60 animation-delay-300"></div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}

export default ScrollDownIndicatorAdvanced
