'use client'

import { useEffect, useState, useRef } from 'react'
import { CheckCircle2, Loader2, Activity } from 'lucide-react'

interface ProfessionalProgressBarProps {
  // النسبة المئوية المستهدفة (0-100)
  targetProgress: number
  // النص الذي يظهر فوق الشريط
  label?: string
  // النص الذي يظهر تحت الشريط
  subLabel?: string
  // عرض النسبة المئوية
  showPercentage?: boolean
  // عرض الوقت المتبقي المقدر
  showTimeRemaining?: boolean
  // لون الشريط
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  // حجم الشريط
  size?: 'sm' | 'md' | 'lg' | 'xl'
  // شريط متحرك (للتحميل غير المحدد)
  indeterminate?: boolean
  // عرض الأيقونة
  showIcon?: boolean
  // الوقت المتوقع للإنجاز بالثواني
  estimatedTime?: number
  // وقت البداية للحساب الدقيق
  startTime?: number
  // عدد العناصر المعالجة
  processedItems?: number
  // إجمالي العناصر
  totalItems?: number
  // معدل المعالجة (عنصر/ثانية)
  processingRate?: number
  // نمط الأنيميشن
  animationStyle?: 'smooth' | 'steps' | 'pulse'
  // عرض التفاصيل
  showDetails?: boolean
}

export default function ProfessionalProgressBar({
  targetProgress,
  label,
  subLabel,
  showPercentage = true,
  showTimeRemaining = false,
  variant = 'primary',
  size = 'md',
  indeterminate = false,
  showIcon = false,
  estimatedTime,
  startTime,
  processedItems,
  totalItems,
  processingRate,
  animationStyle = 'smooth',
  showDetails = false
}: ProfessionalProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const animationRef = useRef<number | undefined>(undefined)

  // حساب الوقت المتبقي
  useEffect(() => {
    if (showTimeRemaining && startTime) {
      const timer = setInterval(() => {
        const now = Date.now() 
        const elapsed = Math.floor((now - startTime) / 1000)
        setElapsedTime(elapsed)
        
        // حساب الوقت المتبقي بناءً على معدل التقدم
        if (targetProgress > 0 && targetProgress < 100) {
          const rate = targetProgress / elapsed
          const remaining = Math.ceil((100 - targetProgress) / rate)
          setRemainingTime(remaining)
        } else if (targetProgress >= 100) {
          setRemainingTime(0)
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [showTimeRemaining, startTime, targetProgress])

  // أنيميشن التقدم السلس
  useEffect(() => {
    const startValue = displayProgress
    let startTimestamp: number | null = null
    const duration = animationStyle === 'smooth' ? 500 : animationStyle === 'steps' ? 200 : 300

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // دالة Easing مختلفة حسب النمط
      let easedProgress = progress
      if (animationStyle === 'smooth') {
        easedProgress = easeInOutCubic(progress)
      } else if (animationStyle === 'pulse') {
        easedProgress = easeOutElastic(progress)
      }
      
      const currentValue = startValue + (targetProgress - startValue) * easedProgress
      setDisplayProgress(Math.min(currentValue, 100))
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [targetProgress, animationStyle, displayProgress])

  // دوال Easing
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }
  
  const easeOutElastic = (t: number): number => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  }

  // تحديد الألوان حسب النوع
  const getColorClasses = () => {
    const colors = {
      primary: 'bg-gradient-to-r from-blue-500 to-blue-600',
      success: 'bg-gradient-to-r from-green-500 to-green-600',
      warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      danger: 'bg-gradient-to-r from-red-500 to-red-600',
      info: 'bg-gradient-to-r from-cyan-500 to-cyan-600'
    }
    return colors[variant]
  }

  // تحديد حجم الشريط
  const getSizeClasses = () => {
    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
      xl: 'h-4'
    }
    return sizes[size]
  }

  // تحديد الأيقونة
  const getIcon = () => {
    if (!showIcon) return null
    
    if (indeterminate) {
      return <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
    } else if (displayProgress >= 100) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />
    } else {
      return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
    }
  }

  // تنسيق الوقت
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds} ثانية`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} دقيقة`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')} ساعة`
  }

  // حساب معدل المعالجة
  const calculateRate = (): string => {
    if (processingRate) {
      return `${processingRate.toFixed(1)} عنصر/ثانية`
    }
    if (processedItems && elapsedTime > 0) {
      const rate = processedItems / elapsedTime
      return `${rate.toFixed(1)} عنصر/ثانية`
    }
    return ''
  }

  return (
    <div className="w-full space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon()}
          {label && (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
        </div>
        
        {showPercentage && !indeterminate && (
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {Math.round(displayProgress)}%
          </span>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="relative">
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${getSizeClasses()}`}>
          {indeterminate ? (
            // شريط متحرك للتحميل غير المحدد
            <div className={`h-full ${getColorClasses()} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            </div>
          ) : (
            // شريط التقدم العادي
            <div
              className={`h-full ${getColorClasses()} transition-all duration-300 ease-out relative overflow-hidden`}
              style={{ width: `${displayProgress}%` }}
            >
              {/* تأثير اللمعان */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
              
              {/* نبضات للتأثير البصري */}
              {animationStyle === 'pulse' && displayProgress < 100 && (
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sub Label and Details */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        {subLabel && <span>{subLabel}</span>}
        
        {showTimeRemaining && remainingTime !== null && !indeterminate && (
          <span className="font-medium">
            {remainingTime > 0 ? `${formatTime(remainingTime)} متبقي` : 'اكتمل!'}
          </span>
        )}
      </div>

      {/* تفاصيل إضافية */}
      {showDetails && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {processedItems !== undefined && totalItems !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-500">العناصر:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {processedItems} / {totalItems}
                </span>
              </div>
            )}
            
            {elapsedTime > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">الوقت المنقضي:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            )}
            
            {calculateRate() && (
              <div className="flex justify-between">
                <span className="text-gray-500">معدل المعالجة:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {calculateRate()}
                </span>
              </div>
            )}
            
            {estimatedTime && (
              <div className="flex justify-between">
                <span className="text-gray-500">الوقت المتوقع:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatTime(estimatedTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Styles */}
      <style jsx>{`
        @keyframes shimmer {
          to {
            transform: translateX(200%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
