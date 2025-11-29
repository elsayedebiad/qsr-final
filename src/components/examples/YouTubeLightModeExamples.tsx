'use client'

/**
 * YouTube Light Mode - Example Components
 * 
 * This file demonstrates how to use the YouTube Light Mode theme
 * in your Next.js application components.
 */

import React, { useState } from 'react'
import { 
  Home, 
  Video, 
  TrendingUp, 
  Clock, 
  ThumbsUp, 
  Settings,
  Search,
  Bell,
  User,
  Menu,
  X,
  Play,
  MoreVertical,
  ChevronRight
} from 'lucide-react'

// ============================================
// 1. SIDEBAR COMPONENT (YouTube-style)
// ============================================

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function YouTubeLightSidebar({ isOpen = true, onClose }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('home')
  
  const menuItems = [
    { id: 'home', icon: Home, label: 'الرئيسية', badge: null },
    { id: 'trending', icon: TrendingUp, label: 'الشائع', badge: null },
    { id: 'videos', icon: Video, label: 'الفيديوهات', badge: 12 },
    { id: 'history', icon: Clock, label: 'السجل', badge: null },
    { id: 'liked', icon: ThumbsUp, label: 'المفضلة', badge: 5 },
    { id: 'settings', icon: Settings, label: 'الإعدادات', badge: null },
  ]

  return (
    <aside 
      className="fixed right-0 top-0 h-full w-64 bg-youtube-light-bg-secondary border-l border-youtube-light-border transition-transform duration-youtube-base ease-youtube z-40 lg:translate-x-0"
      style={{ 
        backgroundColor: 'var(--sidebar-background)',
        borderColor: 'var(--sidebar-border)'
      }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-youtube-light-border">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          القائمة
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-youtube-light-bg-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Sidebar Content */}
      <nav className="p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className="sidebar-item w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-youtube-fast"
              style={{
                backgroundColor: isActive ? 'var(--active-background)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-right">{item.label}</span>
              {item.badge && (
                <span 
                  className="px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-youtube-light-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-youtube-light-bg-hover cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-youtube-light-brand flex items-center justify-center text-white">
            <User className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              اسم المستخدم
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              user@example.com
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ============================================
// 2. TOP NAVIGATION BAR (YouTube-style)
// ============================================

export function YouTubeLightNavbar() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header 
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 rounded-lg hover:bg-youtube-light-bg-hover transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          لوحة التحكم
        </h1>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <input
            type="search"
            placeholder="البحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pr-10 rounded-full border focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--input)',
              borderColor: 'var(--input-border)',
              color: 'var(--foreground)',
            }}
          />
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-youtube-light-bg-hover transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <button className="w-10 h-10 rounded-full bg-youtube-light-brand flex items-center justify-center text-white">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

// ============================================
// 3. CARD COMPONENTS (YouTube-style)
// ============================================

interface CardProps {
  title: string
  description?: string
  thumbnail?: string
  stats?: {
    views?: string
    date?: string
  }
  children?: React.ReactNode
}

export function YouTubeLightCard({ title, description, thumbnail, stats, children }: CardProps) {
  return (
    <div 
      className="card rounded-lg overflow-hidden transition-all duration-youtube-fast cursor-pointer"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative aspect-video bg-youtube-light-bg-hover">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-white text-xs">
            12:34
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 
          className="text-base font-semibold line-clamp-2 mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        
        {description && (
          <p 
            className="text-sm line-clamp-2 mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {description}
          </p>
        )}

        {stats && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {stats.views && <span>{stats.views} مشاهدة</span>}
            {stats.views && stats.date && <span>•</span>}
            {stats.date && <span>{stats.date}</span>}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}

// ============================================
// 4. BUTTON COMPONENTS (YouTube-style)
// ============================================

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function YouTubeLightButton({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  icon,
  onClick,
  className = ''
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-youtube-fast"

  let variantStyles = {}
  
  if (variant === 'primary') {
    variantStyles = {
      backgroundColor: 'var(--primary)',
      color: 'var(--primary-foreground)',
    }
  } else if (variant === 'secondary') {
    variantStyles = {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)'
    }
  } else {
    variantStyles = {
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
    }
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={variantStyles}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}

// ============================================
// 5. STATS CARD (Dashboard)
// ============================================

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  trend?: 'up' | 'down'
}

export function YouTubeLightStatsCard({ title, value, change, icon, trend }: StatsCardProps) {
  return (
    <div 
      className="rounded-lg p-6 transition-all duration-youtube-fast hover:shadow-youtube-card-hover"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface-container)' }}>
          {icon}
        </div>
        {change && (
          <span 
            className="text-sm font-medium"
            style={{ 
              color: trend === 'up' ? 'var(--success)' : 'var(--destructive)' 
            }}
          >
            {change}
          </span>
        )}
      </div>
      
      <h3 
        className="text-3xl font-bold mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </h3>
      
      <p 
        className="text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        {title}
      </p>
    </div>
  )
}

// ============================================
// 6. FULL PAGE EXAMPLE
// ============================================

export function YouTubeLightModeDemo() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Sidebar */}
      <YouTubeLightSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:mr-64">
        {/* Navbar */}
        <YouTubeLightNavbar />

        {/* Page Content */}
        <main className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <YouTubeLightStatsCard
              title="إجمالي المشاهدات"
              value="1.2M"
              change="+12.5%"
              trend="up"
              icon={<Video className="h-6 w-6" style={{ color: 'var(--primary)' }} />}
            />
            <YouTubeLightStatsCard
              title="المشتركين"
              value="45.8K"
              change="+8.3%"
              trend="up"
              icon={<User className="h-6 w-6" style={{ color: 'var(--success)' }} />}
            />
            <YouTubeLightStatsCard
              title="الإعجابات"
              value="892K"
              change="+15.2%"
              trend="up"
              icon={<ThumbsUp className="h-6 w-6" style={{ color: 'var(--warning)' }} />}
            />
            <YouTubeLightStatsCard
              title="المحتوى"
              value="234"
              change="-2.1%"
              trend="down"
              icon={<Play className="h-6 w-6" style={{ color: 'var(--info)' }} />}
            />
          </div>

          {/* Content Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                المحتوى الأخير
              </h2>
              <YouTubeLightButton variant="secondary" size="sm">
                عرض الكل
                <ChevronRight className="h-4 w-4" />
              </YouTubeLightButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <YouTubeLightCard
                  key={i}
                  title={`عنوان المحتوى ${i}`}
                  description="وصف قصير للمحتوى يظهر هنا مع معلومات إضافية"
                  thumbnail={`https://via.placeholder.com/400x225/F8F8F8/111111?text=Video+${i}`}
                  stats={{
                    views: '125K',
                    date: 'منذ 3 أيام'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <YouTubeLightButton variant="primary">
              <Play className="h-5 w-5" />
              إضافة محتوى جديد
            </YouTubeLightButton>
            <YouTubeLightButton variant="secondary">
              <Settings className="h-5 w-5" />
              الإعدادات
            </YouTubeLightButton>
            <YouTubeLightButton variant="ghost">
              المزيد
              <MoreVertical className="h-5 w-5" />
            </YouTubeLightButton>
          </div>
        </main>
      </div>
    </div>
  )
}

export default YouTubeLightModeDemo
