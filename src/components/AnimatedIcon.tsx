'use client'

import { useState, useEffect } from 'react'
import { LucideIcon } from 'lucide-react'

interface AnimatedIconProps {
  icon: LucideIcon
  size?: number
  className?: string
  color?: string
  animationType?: 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'float' | 'glow' | 'shake' | 'heartbeat'
  duration?: number
  delay?: number
  hover?: boolean
}

export default function AnimatedIcon({
  icon: Icon,
  size = 24,
  className = '',
  color = 'currentColor',
  animationType = 'pulse',
  duration = 2,
  delay = 0,
  hover = true
}: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  const getAnimationClass = () => {
    const baseClass = 'transition-all duration-300 ease-in-out'
    
    if (!isVisible) return `${baseClass} opacity-0 scale-0`
    
    const animations = {
      bounce: 'animate-bounce',
      pulse: 'animate-pulse',
      spin: 'animate-spin',
      wiggle: 'animate-wiggle',
      float: 'animate-float',
      glow: 'animate-glow',
      shake: 'animate-shake',
      heartbeat: 'animate-heartbeat'
    }

    const hoverAnimations = {
      bounce: hover && isHovered ? 'animate-bounce' : '',
      pulse: hover && isHovered ? 'animate-pulse' : '',
      spin: hover && isHovered ? 'animate-spin' : '',
      wiggle: hover && isHovered ? 'animate-wiggle' : '',
      float: hover && isHovered ? 'animate-float' : '',
      glow: hover && isHovered ? 'animate-glow' : '',
      shake: hover && isHovered ? 'animate-shake' : '',
      heartbeat: hover && isHovered ? 'animate-heartbeat' : ''
    }

    const animationClass = hover ? hoverAnimations[animationType] : animations[animationType]
    
    return `${baseClass} ${animationClass} ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${getAnimationClass()}`}
      style={{
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Icon 
        size={size} 
        className={`${className} ${isHovered && hover ? 'transform scale-110' : ''}`}
        style={{ color }}
      />
    </div>
  )
}
