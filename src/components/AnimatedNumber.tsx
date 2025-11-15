import React from 'react'
import { useCountAnimation, easingFunctions } from '@/hooks/useCountAnimation'

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  formatNumber?: boolean
  delay?: number
  easingType?: keyof typeof easingFunctions
}

/**
 * Component لعرض الأرقام بشكل متحرك
 * الرقم ينتقل من القيمة القديمة إلى الجديدة بسلاسة
 */
export function AnimatedNumber({
  value,
  duration = 800,
  className = '',
  prefix = '',
  suffix = '',
  formatNumber = true,
  delay = 0,
  easingType = 'easeOut'
}: AnimatedNumberProps) {
  const animatedValue = useCountAnimation({
    value,
    duration,
    delay,
    easingFunction: easingFunctions[easingType]
  })

  const formattedValue = formatNumber 
    ? new Intl.NumberFormat('ar-SA').format(animatedValue)
    : animatedValue.toString()

  return (
    <span className={className} dir="ltr">
      {prefix}{formattedValue}{suffix}
    </span>
  )
}

/**
 * Component للإحصائيات مع animation وتأثيرات hover
 */
interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  delay?: number
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function AnimatedStatCard({
  title,
  value,
  icon,
  gradient,
  delay = 0,
  trend
}: StatCardProps) {
  return (
    <div className={`${gradient} rounded-xl shadow-md p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group cursor-pointer relative overflow-hidden`}>
      {/* تأثير خلفي متحرك */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-500 rounded-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="flex flex-col items-end">
            <AnimatedNumber 
              value={value}
              duration={800}
              delay={delay}
              className="text-4xl font-bold"
              easingType="easeOut"
            />
            {trend && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
        </div>
        <h3 className="text-sm opacity-90 font-medium">{title}</h3>
      </div>
      
      {/* شريط متحرك في الأسفل */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white/40 transition-all duration-1000 ease-out"
          style={{ 
            width: '0%',
            animation: 'fillBar 2s ease-out forwards',
            animationDelay: `${delay}ms`
          }}
        ></div>
      </div>
      
      <style jsx>{`
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}

/**
 * Component مبسط للأرقام الصغيرة في الجداول
 */
export function SmallAnimatedNumber({
  value,
  className = ''
}: {
  value: number
  className?: string
}) {
  const animatedValue = useCountAnimation({
    value,
    duration: 600,
    easingFunction: easingFunctions.easeOut
  })

  return (
    <span className={className} dir="ltr">
      {new Intl.NumberFormat('ar-SA').format(animatedValue)}
    </span>
  )
}
