'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  FileText, 
  Plus, 
  Download, 
  Users, 
  Activity, 
  UserCheck, 
  UserX, 
  User, 
  LogOut, 
  Menu, 
  X,
  Shield,
  Home,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bell,
  BellRing,
  Settings,
  Grid3X3,
  Crown,
  FileSpreadsheet,
  Store,
  ExternalLink,
  Calendar
} from 'lucide-react'

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
  onLogout: () => void
}

interface NavItem {
  id: string
  label: string
  icon: any
  href?: string
  onClick?: () => void
  children?: NavItem[]
  adminOnly?: boolean
  badge?: number
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(['cvs'])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'لوحة التحكم',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'cvs',
      label: 'السير الذاتية',
      icon: FileText,
      children: [
        {
          id: 'all-cvs',
          label: 'جميع السير الذاتية',
          icon: FileText,
          href: '/dashboard'
        },
        {
          id: 'add-cv',
          label: 'إضافة سيرة ذاتية',
          icon: Plus,
          href: '/dashboard/add-cv-alqaeid',
          adminOnly: true
        },
        {
          id: 'import-cv',
          label: 'استيراد من Excel',
          icon: Download,
          href: '/dashboard/import-alqaeid',
          adminOnly: true
        },
        {
          id: 'smart-import',
          label: 'الاستيراد الذكي',
          icon: Sparkles,
          href: '/dashboard/import-smart',
          adminOnly: true
        },
        {
          id: 'google-sheets',
          label: 'Google Sheets',
          icon: FileSpreadsheet,
          href: '/dashboard/google-sheets',
          adminOnly: true
        }
      ]
    },
    {
      id: 'status',
      label: 'حالات السير الذاتية',
      icon: UserCheck,
      children: [
        {
          id: 'booked',
          label: 'محجوز',
          icon: UserCheck,
          href: '/dashboard/booked'
        },
        {
          id: 'hired',
          label: 'متعاقد',
          icon: UserCheck,
          href: '/dashboard/contracts'
        },
        {
          id: 'returned',
          label: 'معاد',
          icon: UserX,
          href: '/dashboard/returned'
        }
      ]
    },
    {
      id: 'gallery',
      label: 'معرض السير الذاتية',
      icon: Grid3X3,
      href: '/gallery'
    },
    {
      id: 'sales',
      label: 'صفحات المبيعات',
      icon: Store,
      children: [
        {
          id: 'sales-config',
          label: 'إعدادات المبيعات',
          icon: Settings,
          href: '/dashboard/sales-config',
          adminOnly: true
        },
        {
          id: 'secondary-banners',
          label: 'البنرات الإضافية',
          icon: Grid3X3,
          href: '/dashboard/secondary-banners',
          adminOnly: true
        },
        {
          id: 'sales1',
          label: 'Sales 1',
          icon: ExternalLink,
          href: '/sales1'
        },
        {
          id: 'sales2',
          label: 'Sales 2',
          icon: ExternalLink,
          href: '/sales2'
        },
        {
          id: 'sales3',
          label: 'Sales 3',
          icon: ExternalLink,
          href: '/sales3'
        },
        {
          id: 'sales4',
          label: 'Sales 4',
          icon: ExternalLink,
          href: '/sales4'
        },
        {
          id: 'sales5',
          label: 'Sales 5',
          icon: ExternalLink,
          href: '/sales5'
        },
        {
          id: 'sales6',
          label: 'Sales 6',
          icon: ExternalLink,
          href: '/sales6'
        },
        {
          id: 'sales7',
          label: 'Sales 7',
          icon: ExternalLink,
          href: '/sales7'
        }
      ]
    },
    {
      id: 'notifications',
      label: 'مركز الإشعارات',
      icon: BellRing,
      href: '/dashboard/notifications',
      adminOnly: true
    },
    {
      id: 'activity-log',
      label: 'سجل الأنشطة',
      icon: Activity,
      href: '/dashboard/activity-log',
      adminOnly: true
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      icon: Users,
      href: '/dashboard/users',
      adminOnly: true
    },
    {
      id: 'super-admin',
      label: 'لوحة المدير العام',
      icon: Crown,
      href: '/dashboard/super-admin',
      adminOnly: true
    },
    {
      id: 'developer-control',
      label: 'لوحة المطور',
      icon: Shield,
      href: '/developer-control',
      adminOnly: false // سيتم التحكم به بشكل خاص
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    // إخفاء لوحة المطور من الجميع ما عدا المطور
    if (item.id === 'developer-control') {
      if (user?.email !== 'developer@system.local' && user?.role !== 'DEVELOPER') {
        return null
      }
    }

    // Hide admin-only items for non-admin users
    if (item.adminOnly) {
      // DEVELOPER has full access to everything
      if (user?.role === 'DEVELOPER' || user?.email === 'developer@system.local') {
        // Developer sees everything - no restrictions
      }
      // Allow SUB_ADMIN to see CV-related items only (add, import, smart-import, google-sheets)
      else if (user?.role === 'SUB_ADMIN') {
        const subAdminAllowedItems = ['add-cv', 'import-cv', 'smart-import', 'google-sheets']
        if (!subAdminAllowedItems.includes(item.id)) {
          return null
        }
      }
      // CUSTOMER_SERVICE cannot see any admin-only items
      else if (user?.role === 'CUSTOMER_SERVICE') {
        return null
      }
      // Hide from regular users
      else if (user?.role !== 'ADMIN') {
        return null
      }
    }

    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const active = item.href ? isActive(item.href) : false

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group sidebar-item ${
              active
                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            style={{ paddingRight: `${12 + level * 16}px` }}
          >
            <div className="flex items-center">
              <div className={`${isCollapsed ? 'mx-auto' : 'ml-3'}`}>
                <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              {!isCollapsed && <span>{item.label}</span>}
            </div>
            {!isCollapsed && (
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </button>
          
          <div className={`overflow-hidden sidebar-dropdown ${
            isExpanded && !isCollapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="mt-1 space-y-1 pb-1">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() => {
            if (item.href) {
              router.push(item.href)
            } else if (item.onClick) {
              item.onClick()
            }
          }}
          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group sidebar-item ${
            active
              ? 'bg-primary/10 text-primary border-r-2 border-primary'
              : level > 0 
                ? 'text-muted-foreground hover:bg-primary/5 hover:text-primary ml-2'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          style={{ paddingRight: `${12 + level * 16}px` }}
        >
          <div className={`${isCollapsed ? 'mx-auto' : 'ml-3'}`}>
            <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          {!isCollapsed && (
            <span className="flex-1 text-right">{item.label}</span>
          )}
          {!isCollapsed && item.badge && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </button>
      </div>
    )
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'DEVELOPER': return 'Developer'
      case 'ADMIN': return 'مدير عام'
      case 'SUB_ADMIN': return 'Operation'
      case 'CUSTOMER_SERVICE': return 'Customer Service'
      case 'USER': return 'مستخدم عادي'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DEVELOPER': return 'bg-purple-100 text-purple-800'
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'SUB_ADMIN': return 'bg-yellow-100 text-yellow-800'
      case 'CUSTOMER_SERVICE': return 'bg-blue-100 text-blue-800'
      case 'USER': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-card shadow-xl z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-72'
      } lg:relative lg:translate-x-0 ${
        isCollapsed ? 'translate-x-full lg:translate-x-0' : 'translate-x-0'
      } border-l border-border backdrop-blur-sm flex flex-col`}>
        
        {/* ===== الجزء العلوي الثابت ===== */}
        <div className="flex-shrink-0">
          {/* Header */}
          <div className="relative p-4 border-b border-border bg-muted/50">
            {!isCollapsed && (
              <div className="flex items-center">
                <div className="bg-primary/10 rounded-lg p-2 ml-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">نظام إدارة السير</h1>
                  <p className="text-muted-foreground text-sm">لوحة التحكم</p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`${isCollapsed ? 'mx-auto block' : 'absolute top-4 left-4'} p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-all duration-200`}
            >
              {isCollapsed ? (
                <Menu className="h-5 w-5 text-muted-foreground" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* User Info */}
          {!isCollapsed && user && (
            <div className="p-4 border-b border-border">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ml-3">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-card"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground mb-1">{user.email}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md ${getRoleColor(user.role)}`}>
                      <Shield className="h-3 w-3" />
                      {getRoleText(user.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Collapsed User Avatar */}
          {isCollapsed && user && (
            <div className="p-3 flex justify-center border-b border-border">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full border border-card"></div>
              </div>
            </div>
          )}
        </div>

        {/* ===== منطقة القائمة القابلة للتمرير ===== */}
        <div className="flex-1 overflow-y-auto sidebar-scroll-area">
          <nav className="p-4 space-y-1">
            {navItems.map(item => renderNavItem(item))}
          </nav>
        </div>

        {/* ===== الجزء السفلي الثابت ===== */}
        <div className="flex-shrink-0">
          {/* Admin Tools */}
          {!isCollapsed && user?.role === 'ADMIN' && (
            <div className="p-4 border-t border-border">
              <button
                onClick={() => {
                  localStorage.removeItem('system_activated')
                  window.location.reload()
                }}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 mb-2"
              >
                <Settings className="h-5 w-5 ml-3" />
                <span>إعادة تعيين التفعيل</span>
              </button>
            </div>
          )}

          {/* Logout Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={onLogout}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className={`h-5 w-5 ${isCollapsed ? '' : 'ml-3'}`} />
              {!isCollapsed && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 right-4 z-50 lg:hidden bg-primary p-3 rounded-lg shadow-lg hover:bg-primary/90 transition-all duration-200"
        >
          <Menu className="h-5 w-5 text-primary-foreground" />
        </button>
      )}
    </>
  )
}
