'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, Plus, Download, Users, Activity, UserCheck, UserX, 
  LogOut, Menu, X, Shield, Home, Store, ExternalLink, Network,
  BellRing, Crown, Settings, Grid3X3, FileSpreadsheet, Sparkles,
  ChevronDown, User, Eye
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: any
  href?: string
  children?: NavItem[]
  badge?: number
}

interface SidebarProps {
  user: any
  onLogout: () => void
}

export default function ImprovedSidebar({ user, onLogout }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [expanded, setExpanded] = useState<string[]>(['cvs'])

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Home, href: '/dashboard' },
    {
      id: 'cvs',
      label: 'السير الذاتية',
      icon: FileText,
      children: [
        { id: 'all-cvs', label: 'جميع السير', icon: FileText, href: '/dashboard' },
        { id: 'add-cv', label: 'إضافة سيرة', icon: Plus, href: '/dashboard/add-cv-alqaeid' },
        { id: 'import', label: 'استيراد Excel', icon: Download, href: '/dashboard/import-alqaeid' },
        { id: 'smart', label: 'استيراد ذكي', icon: Sparkles, href: '/dashboard/import-smart' },
        { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, href: '/dashboard/google-sheets' },
      ],
    },
    {
      id: 'status',
      label: 'الحالات',
      icon: UserCheck,
      children: [
        { id: 'booked', label: 'محجوز', icon: UserCheck, href: '/dashboard/booked' },
        { id: 'hired', label: 'متعاقد', icon: UserCheck, href: '/dashboard/contracts' },
        { id: 'returned', label: 'معاد', icon: UserX, href: '/dashboard/returned' },
      ],
    },
    {
      id: 'sales',
      label: 'صفحات المبيعات',
      icon: Store,
      children: [
        { id: 'sales-cfg', label: 'إعدادات', icon: Settings, href: '/dashboard/sales-config' },
        { id: 'banners', label: 'البنرات', icon: Grid3X3, href: '/dashboard/secondary-banners' },
        ...Array.from({length: 11}, (_, i) => ({
          id: `s${i+1}`,
          label: `Sales ${i+1}`,
          icon: ExternalLink,
          href: `/sales${i+1}`
        }))
      ],
    },
    { id: 'distribution', label: 'نظام التوزيع', icon: Network, href: '/dashboard/distribution' },
    { id: 'visits', label: 'سجل الزيارات', icon: Eye, href: '/dashboard/visits' },
    { id: 'notifications', label: 'الإشعارات', icon: BellRing, href: '/dashboard/notifications' },
    { id: 'activity', label: 'سجل الأنشطة', icon: Activity, href: '/dashboard/activity-log' },
    { id: 'users', label: 'المستخدمين', icon: Users, href: '/dashboard/users' },
    { id: 'super', label: 'المدير العام', icon: Crown, href: '/dashboard/super-admin' },
    { id: 'dev', label: 'المطور', icon: Shield, href: '/developer-control' },
  ]

  const toggle = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  const NavLink = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expanded.includes(item.id)
    const active = isActive(item.href)

    if (hasChildren) {
      return (
        <div className="mb-1">
          <button
            onClick={() => toggle(item.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
              active ? 'bg-blue-500/10 text-blue-500' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              {isOpen && <span className="text-sm font-medium">{item.label}</span>}
            </div>
            {isOpen && (
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </button>
          {isOpen && isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => <NavLink key={child.id} item={child} level={level + 1} />)}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        href={item.href || '#'}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all mb-1 ${
          active ? 'bg-blue-500/10 text-blue-500' : 'text-gray-300 hover:bg-gray-800'
        }`}
      >
        <item.icon className="h-5 w-5" />
        {isOpen && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-gray-900 border-l border-gray-800 z-50 transition-all ${
        isOpen ? 'w-72' : 'w-20'
      } flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-white font-bold">نظام السير</h1>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
          >
            {isOpen ? <X className="h-5 w-5 text-gray-400" /> : <Menu className="h-5 w-5 text-gray-400" />}
          </button>
        </div>

        {/* User Info */}
        {isOpen && user && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <User className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {navItems.map(item => <NavLink key={item.id} item={item} />)}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span className="text-sm font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </div>

      {/* Mobile Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 right-4 z-40 lg:hidden p-3 bg-blue-500 rounded-lg"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      )}
    </>
  )
}
