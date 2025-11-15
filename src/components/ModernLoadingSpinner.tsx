'use client'

import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface ModernLoadingSpinnerProps {
  message?: string
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'gradient'
}

export default function ModernLoadingSpinner({
  message = 'جاري التحميل...',
  showProgress = false,
  size = 'md',
  variant = 'gradient'
}: ModernLoadingSpinnerProps) {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState('')

  // Simulate progress for better UX
  useEffect(() => {
    if (!showProgress) return

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 500)

    return () => clearInterval(interval)
  }, [showProgress])

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {/* Loading Animation based on variant */}
        {variant === 'spinner' && (
          <div className="relative inline-block">
            <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
        )}

        {variant === 'dots' && (
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full bg-primary animate-bounce"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}

        {variant === 'pulse' && (
          <div className="relative inline-block">
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse`} />
            <Sparkles className="absolute inset-0 m-auto text-white animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        )}

        {variant === 'gradient' && (
          <div className="relative inline-block">
            {/* Outer rotating ring */}
            <div className={`${sizeClasses[size]} rounded-full border-4 border-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-border animate-spin`} style={{ animationDuration: '1.5s' }}>
              <div className="absolute inset-0 rounded-full bg-background m-1" />
            </div>
            
            {/* Inner pulsing circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse`} />
            </div>

            {/* Sparkle effect */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading Message */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            {message}
            <span className="inline-block w-8 text-left">{dots}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            الرجاء الانتظار قليلاً
          </p>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-64 space-y-2">
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Decorative elements */}
        <div className="flex items-center justify-center gap-4 opacity-50">
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-ping" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
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
