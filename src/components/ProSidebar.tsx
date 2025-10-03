'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Settings, 
  FileText, 
  Users, 
  BarChart3, 
  Mail, 
  Calendar, 
  Search,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
}

interface ProSidebarProps {
  className?: string
}

export default function ProSidebar({ className = '' }: ProSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Navigation items
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'users', label: 'Users', icon: Users, href: '/users', badge: 3 },
    { id: 'documents', label: 'Documents', icon: FileText, href: '/documents' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
    { id: 'messages', label: 'Messages', icon: Mail, href: '/messages', badge: 12 },
    { id: 'notifications', label: 'Notifications', icon: Bell, href: '/notifications' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  ]

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Handle body scroll lock for mobile
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileOpen])

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsMobileOpen(false)
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white shadow-lg p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200"
        aria-label="Toggle mobile menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl z-50 
        transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'w-16' : 'w-72'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:relative lg:translate-x-0
        ${className}
      `}>
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">ProApp</h1>
                  <p className="text-xs text-gray-500">Dashboard</p>
                </div>
              </div>
            )}
            
            {/* Desktop Toggle Button */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-lg bg-white/80 hover:bg-white shadow-sm border border-gray-200 transition-all duration-200"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              ) : (
                <X className="h-4 w-4 text-gray-600" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close mobile menu"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation - Scrollable Area */}
        <nav className="flex-1 overflow-y-auto pro-scroll">
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium 
                    transition-all duration-200 group relative
                    ${active 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={`
                          px-2 py-1 text-xs font-semibold rounded-full
                          ${active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-red-100 text-red-600'
                          }
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.label}
                      {item.badge && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50/50">
          <button
            onClick={() => handleNavigation('/logout')}
            className={`
              w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium 
              text-red-600 hover:bg-red-50 transition-all duration-200 group
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
          >
            <LogOut className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>Logout</span>}
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Content Spacer for Desktop */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`} />
    </>
  )
}
