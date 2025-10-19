'use client'

import { useEffect, useState } from 'react'

interface SmoothProgressBarProps {
  targetProgress: number
  duration?: number // مدة الانتقال بالميلي ثانية
  showPercentage?: boolean
  height?: string
  className?: string
  color?: string
  backgroundColor?: string
}

export default function SmoothProgressBar({
  targetProgress,
  duration = 300,
  showPercentage = true,
  height = '8px',
  className = '',
  color = 'bg-primary',
  backgroundColor = 'bg-muted'
}: SmoothProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    let animationFrame: number
    const startProgress = displayProgress

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsedTime = currentTime - startTime

      if (elapsedTime < duration) {
        // استخدام دالة easing للحصول على انتقال سلس
        const progress = easeInOutCubic(elapsedTime / duration)
        const currentProgress = startProgress + (targetProgress - startProgress) * progress
        setDisplayProgress(Math.min(currentProgress, 100))
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayProgress(targetProgress)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [targetProgress, duration, displayProgress])

  // دالة Easing للحصول على انتقال سلس
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">التقدم</span>
          <span className="text-sm font-semibold text-foreground">
            {Math.round(displayProgress)}%
          </span>
        </div>
      )}
      <div 
        className={`w-full ${backgroundColor} rounded-full overflow-hidden shadow-inner`}
        style={{ height }}
      >
        <div
          className={`h-full ${color} transition-all duration-300 ease-out relative overflow-hidden rounded-full`}
          style={{ width: `${displayProgress}%` }}
        >
          {/* تأثير اللمعان المتحرك */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          to {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
