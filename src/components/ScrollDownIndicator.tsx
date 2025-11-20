'use client'

import React, { useState, useEffect } from 'react'
import Lottie from 'lottie-react'

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

  // Lottie animation data - Scroll down arrow animation
  const scrollAnimation = {
    "v": "5.7.4",
    "fr": 60,
    "ip": 0,
    "op": 120,
    "w": 100,
    "h": 100,
    "nm": "Scroll Down",
    "ddd": 0,
    "assets": [],
    "layers": [
      {
        "ddd": 0,
        "ind": 1,
        "ty": 4,
        "nm": "Arrow 1",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 0, "s": [0] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 20, "s": [100] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 80, "s": [100] },
              { "t": 100, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 0, "s": [50, 30, 0], "to": [0, 5, 0], "ti": [0, -5, 0] },
              { "t": 100, "s": [50, 60, 0] }
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
                    "v": [[-8, -5], [0, 5], [8, -5]],
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
      },
      {
        "ddd": 0,
        "ind": 2,
        "ty": 4,
        "nm": "Arrow 2",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 15, "s": [0] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 35, "s": [100] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 95, "s": [100] },
              { "t": 115, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 15, "s": [50, 40, 0], "to": [0, 5, 0], "ti": [0, -5, 0] },
              { "t": 115, "s": [50, 70, 0] }
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
                    "v": [[-8, -5], [0, 5], [8, -5]],
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
      },
      {
        "ddd": 0,
        "ind": 3,
        "ty": 4,
        "nm": "Arrow 3",
        "sr": 1,
        "ks": {
          "o": {
            "a": 1,
            "k": [
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 30, "s": [0] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 50, "s": [100] },
              { "i": { "x": [0.667], "y": [1] }, "o": { "x": [0.333], "y": [0] }, "t": 110, "s": [100] },
              { "t": 120, "s": [0] }
            ]
          },
          "r": { "a": 0, "k": 0 },
          "p": {
            "a": 1,
            "k": [
              { "i": { "x": 0.667, "y": 1 }, "o": { "x": 0.333, "y": 0 }, "t": 30, "s": [50, 50, 0], "to": [0, 5, 0], "ti": [0, -5, 0] },
              { "t": 120, "s": [50, 80, 0] }
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
                    "v": [[-8, -5], [0, 5], [8, -5]],
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
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center cursor-pointer group transition-all duration-300 hover:scale-110"
      onClick={() => window.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' })}
    >
      {/* Lottie Animation Container */}
      <div className="relative">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
        
        {/* Main container */}
        <div className="relative bg-white/90 backdrop-blur-md rounded-full p-4 shadow-2xl border-2 border-white/50 group-hover:shadow-blue-500/50 transition-all duration-300">
          <Lottie 
            animationData={scrollAnimation}
            loop={true}
            className="w-16 h-16"
          />
        </div>
      </div>

      {/* Text with enhanced styling */}
      <div className="mt-3 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-all duration-300"></div>
        <p className="relative text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 rounded-full whitespace-nowrap shadow-lg group-hover:shadow-xl transition-all duration-300">
          اسحب لأسفل لعرض السير
        </p>
      </div>

      {/* Decorative pulse rings */}
      <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-blue-500"></div>
    </div>
  )
}

export default ScrollDownIndicator