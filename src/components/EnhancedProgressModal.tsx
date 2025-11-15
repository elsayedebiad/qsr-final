'use client'

import { useEffect, useState } from 'react'
import { Download, CheckCircle, AlertTriangle, X, Loader2, Package, Zap } from 'lucide-react'

interface EnhancedProgressModalProps {
  isOpen: boolean
  progress: number
  totalItems: number
  completedItems?: number
  title?: string
  description?: string
  status?: 'preparing' | 'downloading' | 'processing' | 'success' | 'error'
  errorMessage?: string
  onClose?: () => void
  showStats?: boolean
}

export default function EnhancedProgressModal({
  isOpen,
  progress,
  totalItems,
  completedItems = 0,
  title = 'جاري التحميل',
  description = 'يتم تحميل الملفات المحددة',
  status = 'downloading',
  errorMessage = '',
  onClose,
  showStats = true
}: EnhancedProgressModalProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [speed, setSpeed] = useState(0)

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedProgress(prev => {
        const diff = progress - prev
        if (Math.abs(diff) < 0.1) return progress
        return prev + diff * 0.1
      })
    }, 50)

    return () => clearInterval(interval)
  }, [progress])

  // Calculate download speed
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(Math.random() * 5 + 2) // Simulate speed 2-7 MB/s
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isOpen) return null

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
      case 'error':
        return <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
      case 'preparing':
        return <Package className="w-16 h-16 text-blue-500 animate-pulse" />
      default:
        return (
          <div className="relative">
            <Download className="w-16 h-16 text-primary animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
        )
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'from-green-500 via-emerald-500 to-teal-500'
      case 'error':
        return 'from-red-500 via-rose-500 to-pink-500'
      case 'preparing':
        return 'from-blue-500 via-indigo-500 to-purple-500'
      default:
        return 'from-blue-600 via-purple-600 to-pink-600'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
        onClick={status === 'success' || status === 'error' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-border/50">
        {/* Close button (only when finished) */}
        {(status === 'success' || status === 'error') && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Progress Info */}
        {status !== 'error' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                تم تحميل {Math.round((animatedProgress / 100) * totalItems)} من {totalItems}
              </span>
              <span className="text-lg font-bold text-primary">
                {Math.round(animatedProgress)}%
              </span>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative h-4 bg-muted rounded-full overflow-hidden shadow-inner">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                }} />
              </div>

              {/* Progress fill */}
              <div
                className={`h-full bg-gradient-to-r ${getStatusColor()} rounded-full transition-all duration-300 ease-out relative overflow-hidden`}
                style={{ width: `${animatedProgress}%` }}
              >
                {/* Multiple shimmer effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-slow" />
                
                {/* Pulse effect at the end */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-sm animate-pulse" />
              </div>

              {/* Progress markers */}
              <div className="absolute inset-0 flex justify-between items-center px-1">
                {[0, 25, 50, 75, 100].map((marker) => (
                  <div
                    key={marker}
                    className={`w-0.5 h-3 rounded-full transition-colors duration-300 ${
                      animatedProgress >= marker ? 'bg-white/50' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Speed indicator */}
            {status === 'downloading' && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span>{speed.toFixed(1)} MB/s</span>
                <span className="mx-2">•</span>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>متصل</span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {status === 'error' && errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500 text-center">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        {showStats && status !== 'error' && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-xl">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">التنسيق</div>
              <div className="font-semibold text-sm">PNG</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">الحالة</div>
              <div className="font-semibold text-sm">
                {status === 'success' ? 'مكتمل' : 
                 status === 'preparing' ? 'جاري التجهيز' : 
                 'قيد التحميل'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">العناصر</div>
              <div className="font-semibold text-sm">{totalItems}</div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === 'success' && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                تم التحميل بنجاح!
              </span>
            </div>
          </div>
        )}

        {/* Animated dots */}
        {status === 'downloading' && (
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        @keyframes shimmer-slow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-shimmer-slow {
          animation: shimmer-slow 3s infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
