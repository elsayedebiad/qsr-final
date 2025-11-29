'use client'

/**
 * Theme Toggle Component
 * 
 * Allows users to switch between Dark Mode and YouTube Light Mode
 */

import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const preferredTheme = savedTheme || 'dark'
    setTheme(preferredTheme)
    applyTheme(preferredTheme)
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement

    if (newTheme === 'light') {
      root.setAttribute('data-theme', 'light')
      root.classList.remove('dark')
      root.classList.add('light-mode')
      root.style.colorScheme = 'light'
    } else {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark')
      root.classList.remove('light-mode')
      root.style.colorScheme = 'dark'
    }

    localStorage.setItem('theme', newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg opacity-50 cursor-not-allowed">
        <div className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
      style={{
        backgroundColor: theme === 'light' ? 'var(--hover-background)' : 'var(--accent)',
        color: theme === 'light' ? 'var(--text-primary)' : 'var(--foreground)',
      }}
      aria-label={theme === 'dark' ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
      title={theme === 'dark' ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}

/**
 * Alternative: Compact Theme Toggle (for sidebar/header)
 */
export function CompactThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const preferredTheme = savedTheme || 'dark'
    setTheme(preferredTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    
    const root = document.documentElement
    if (newTheme === 'light') {
      root.setAttribute('data-theme', 'light')
      root.classList.remove('dark')
      root.classList.add('light-mode')
      root.style.colorScheme = 'light'
    } else {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark')
      root.classList.remove('light-mode')
      root.style.colorScheme = 'dark'
    }
    
    localStorage.setItem('theme', newTheme)
  }

  if (!mounted) return null

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
      onClick={toggleTheme}
      style={{
        backgroundColor: theme === 'light' ? 'var(--hover-background)' : 'transparent',
      }}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">
        {theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم'}
      </span>
    </div>
  )
}

/**
 * USAGE:
 * 
 * 1. In your Navbar/Header:
 * ```tsx
 * import { ThemeToggle } from '@/components/ThemeToggle'
 * 
 * <ThemeToggle />
 * ```
 * 
 * 2. In your Sidebar:
 * ```tsx
 * import { CompactThemeToggle } from '@/components/ThemeToggle'
 * 
 * <CompactThemeToggle />
 * ```
 */

export default ThemeToggle
