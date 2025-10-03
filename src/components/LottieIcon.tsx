'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

interface LottieIconProps {
  animationPath: string
  width?: number
  height?: number
  loop?: boolean
  autoplay?: boolean
  className?: string
}

export default function LottieIcon({ 
  animationPath, 
  width = 24, 
  height = 24, 
  loop = true, 
  autoplay = true,
  className = ""
}: LottieIconProps) {
  const [animationData, setAnimationData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch(animationPath)
        const data = await response.json()
        setAnimationData(data)
      } catch (error) {
        console.error('Error loading Lottie animation:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnimation()
  }, [animationPath])

  if (loading || !animationData) {
    return (
      <div 
        className={`animate-pulse bg-gray-300 rounded ${className}`}
        style={{ width, height }}
      />
    )
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      style={{ width, height }}
      className={className}
    />
  )
}
