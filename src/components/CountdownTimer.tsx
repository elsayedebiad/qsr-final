'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface CountdownTimerProps {
  deadlineAt: string
  onExpired?: () => void
}

export default function CountdownTimer({ deadlineAt, onExpired }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const deadline = new Date(deadlineAt).getTime()
      const difference = deadline - now

      if (difference <= 0) {
        if (onExpired) onExpired()
        return { hours: 0, minutes: 0, seconds: 0, total: 0 }
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { hours, minutes, seconds, total: difference }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [deadlineAt, onExpired])

  if (!timeLeft) {
    return null
  }

  if (timeLeft.total === 0) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="w-3 h-3" />
        انتهى الوقت
      </div>
    )
  }

  // تحذير إذا كان الوقت المتبقي أقل من ساعة
  const isUrgent = timeLeft.total < 3600000 // أقل من ساعة
  const isVeryUrgent = timeLeft.total < 600000 // أقل من 10 دقائق

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isVeryUrgent 
        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
        : isUrgent 
        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    }`}>
      <Clock className="w-3 h-3" />
      <span dir="ltr">
        {timeLeft.hours > 0 && `${timeLeft.hours}h `}
        {(timeLeft.hours > 0 || timeLeft.minutes > 0) && `${timeLeft.minutes}m `}
        {timeLeft.seconds}s
      </span>
    </div>
  )
}
