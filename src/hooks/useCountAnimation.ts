import { useEffect, useState, useRef } from 'react'

interface UseCountAnimationOptions {
  value: number
  duration?: number
  delay?: number
  easingFunction?: (t: number) => number
}

/**
 * Hook لإضافة animation للأرقام عند تغييرها
 * يجعل الرقم ينتقل من القيمة القديمة إلى الجديدة بشكل سلس
 */
export function useCountAnimation({
  value,
  duration = 800,
  delay = 0,
  easingFunction = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOut
}: UseCountAnimationOptions): number {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)

  useEffect(() => {
    // إذا القيمة لم تتغير، لا تعمل animation
    if (prevValueRef.current === value) {
      return
    }

    const startValue = prevValueRef.current
    const endValue = value
    let startTimestamp: number | null = null
    let animationFrame: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // تطبيق easing function للحركة السلسة
      const easedProgress = easingFunction(progress)
      
      // حساب القيمة الحالية من startValue إلى endValue
      const currentValue = Math.round(easedProgress * (endValue - startValue) + startValue)
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step)
      } else {
        setDisplayValue(endValue) // التأكد من الوصول للقيمة النهائية بالضبط
        prevValueRef.current = endValue
      }
    }

    // بدء الanimation بعد التأخير
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(step)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [value, duration, delay, easingFunction])

  return displayValue
}

// Easing functions جاهزة للاستخدام
export const easingFunctions = {
  // حركة خطية
  linear: (t: number) => t,
  
  // بطيء في البداية والنهاية
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  // بطيء في البداية
  easeIn: (t: number) => t * t,
  
  // بطيء في النهاية
  easeOut: (t: number) => t * (2 - t),
  
  // حركة مرنة (bounce)
  elastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  
  // حركة ارتدادية
  bounce: (t: number) => {
    const n1 = 7.5625
    const d1 = 2.75

    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }
}
