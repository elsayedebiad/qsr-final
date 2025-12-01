"use client"

import * as React from "react"
import { useRouter, usePathname } from 'next/navigation'
import { getSalesPageName } from '@/lib/sales-pages-config'
import { LucideIcon } from "lucide-react"
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
  Shield,
  Home,
  Sparkles,
  BellRing,
  Settings,
  Grid3X3,
  Crown,
  FileSpreadsheet,
  Store,
  ExternalLink,
  ChevronRight,
  ChevronsUpDown,
  Image,
  Power,
  PowerOff,
  Archive,
  Wifi,
  BarChart3,
  Network,
  Clock,
  Briefcase,
  Search,
  MousePointerClick,
  Phone,
  Link,
  Sun,
  Moon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href?: string
  onClick?: () => void
  children?: NavItem[]
  adminOnly?: boolean
  badge?: number
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
  onLogout: () => void
}

export function AppSidebar({ user, onLogout, ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const [systemActive, setSystemActive] = React.useState(true)
  const [togglingSystem, setTogglingSystem] = React.useState(false)
  const [salesPageNames, setSalesPageNames] = React.useState<Record<string, string>>({})
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = React.useState(false)

  // تحميل أسماء صفحات المبيعات
  React.useEffect(() => {
    const loadSalesPageNames = () => {
      const names: Record<string, string> = {}
      for (let i = 1; i <= 11; i++) {
        names[`sales${i}`] = getSalesPageName(`sales${i}`)
      }
      setSalesPageNames(names)
    }
    
    loadSalesPageNames()
    
    // الاستماع للتحديثات
    const handleUpdate = () => loadSalesPageNames()
    window.addEventListener('salesPagesConfigUpdated', handleUpdate)
    return () => window.removeEventListener('salesPagesConfigUpdated', handleUpdate)
  }, [])

  // Load theme from localStorage on mount
  React.useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const preferredTheme = savedTheme || 'dark'
    setTheme(preferredTheme)
  }, [])

  // جلب حالة النظام للمطور
  React.useEffect(() => {
    if (user?.role === 'DEVELOPER' || user?.email === 'developer@system.local') {
      fetchSystemStatus()
    }
  }, [user])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/system-status')
      const data = await response.json()
      setSystemActive(data.isActive)
    } catch (error) {
      console.error('Error fetching system status:', error)
    }
  }

  const toggleSystemStatus = async () => {
    if (typeof window === 'undefined') return // Skip on server-side
    
    setTogglingSystem(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/developer/toggle-system', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !systemActive })
      })

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة النظام')
      }

      const data = await response.json()
      setSystemActive(data.isActive)
    } catch (error) {
      console.error('Error toggling system:', error)
    } finally {
      setTogglingSystem(false)
    }
  }

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
        },
        {
          id: 'archive',
          label: 'الأرشيف',
          icon: Archive,
          href: '/dashboard/archive'
        }
      ]
    },
    {
      id: 'contracts',
      label: 'إدارة العقود',
      icon: Briefcase,
      adminOnly: true,
      children: [
        {
          id: 'add-contract',
          label: 'إضافة عقد جديد',
          icon: Plus,
          href: '/dashboard/add-contract',
          adminOnly: true
        },
        {
          id: 'all-contracts',
          label: 'ادارة المتابعة ',
          icon: Briefcase,
          href: '/dashboard/add-contracts',
          adminOnly: true
        },
        {
          id: 'old-contracts',
          label: 'العقود القديمة',
          icon: Briefcase,
          href: '/dashboard/contracts',
          adminOnly: true
        }
      ]
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
          id: 'user-sales-pages',
          label: 'تخصيص صفحات المبيعات',
          icon: Users,
          href: '/dashboard/user-sales-pages',
          adminOnly: true
        },
        {
          id: 'banners',
          label: 'إدارة البنرات',
          icon: Image,
          href: '/dashboard/banners',
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
          label: salesPageNames['sales1'] || 'Sales 1',
          icon: ExternalLink,
          href: '/sales1'
        },
        {
          id: 'sales2',
          label: salesPageNames['sales2'] || 'Sales 2',
          icon: ExternalLink,
          href: '/sales2'
        },
        {
          id: 'sales3',
          label: salesPageNames['sales3'] || 'Sales 3',
          icon: ExternalLink,
          href: '/sales3'
        },
        {
          id: 'sales4',
          label: salesPageNames['sales4'] || 'Sales 4',
          icon: ExternalLink,
          href: '/sales4'
        },
        {
          id: 'sales5',
          label: salesPageNames['sales5'] || 'Sales 5',
          icon: ExternalLink,
          href: '/sales5'
        },
        {
          id: 'sales6',
          label: salesPageNames['sales6'] || 'Sales 6',
          icon: ExternalLink,
          href: '/sales6'
        },
        {
          id: 'sales7',
          label: salesPageNames['sales7'] || 'Sales 7',
          icon: ExternalLink,
          href: '/sales7'
        },
        {
          id: 'sales8',
          label: salesPageNames['sales8'] || 'Sales 8',
          icon: ExternalLink,
          href: '/sales8'
        },
        {
          id: 'sales9',
          label: salesPageNames['sales9'] || 'Sales 9',
          icon: ExternalLink,
          href: '/sales9'
        },
        {
          id: 'sales10',
          label: salesPageNames['sales10'] || 'Sales 10',
          icon: ExternalLink,
          href: '/sales10'
        },
        {
          id: 'sales11',
          label: salesPageNames['sales11'] || 'Sales 11',
          icon: ExternalLink,
          href: '/sales11'
        }
      ]
    },
    {
      id: 'distribution',
      label: 'نظام التوزيع',
      icon: Network,
      href: '/dashboard/distribution',
      adminOnly: true
    },
    {
      id: 'visits-report',
      label: 'تقرير الزيارات المباشر',
      icon: Activity,
      href: '/dashboard/visits-report',
      adminOnly: true
    },
    {
      id: 'visits-archive',
      label: 'أرشيف تقارير الزيارات',
      icon: Archive,
      href: '/dashboard/visits-archive',
      adminOnly: true
    },
    {
      id: 'notifications',
      label: 'مركز الإشعارات',
      icon: BellRing,
      href: '/dashboard/notifications',
      adminOnly: true
    },
    {
      id: 'online-users',
      label: 'المستخدمون المتصلون',
      icon: Wifi,
      href: '/dashboard/online-users',
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
      id: 'attendance-analysis',
      label: 'تحليل الحضور',
      icon: Clock,
      href: '/dashboard/attendance-analysis',
      adminOnly: true
    },
    {
      id: 'upload-statistics',
      label: 'إحصائيات الرفع والتحديث',
      icon: BarChart3,
      href: '/dashboard/upload-statistics',
      adminOnly: true
    },
    {
      id: 'search-analytics',
      label: 'تحليلات البحث والفلاتر',
      icon: Search,
      href: '/dashboard/search-analytics',
      adminOnly: true
    },
    {
      id: 'booking-clicks',
      label: 'تتبع نقرات الحجز والاستفسار',
      icon: MousePointerClick,
      href: '/dashboard/booking-clicks',
      adminOnly: true
    },
    {
      id: 'phone-numbers',
      label: 'أرقام هواتف العملاء',
      icon: Phone,
      href: '/dashboard/phone-numbers',
      adminOnly: false // متاح لجميع المستخدمين
    },
    {
      id: 'users',
      label: 'إدارة المستخدمين',
      icon: Users,
      href: '/dashboard/users',
      adminOnly: true
    },
    {
      id: 'user-pages',
      label: 'ربط المستخدمين بالصفحات',
      icon: Link,
      href: '/dashboard/user-pages',
      adminOnly: true
    },
    {
      id: 'super-admin',
      label: 'لوحة المدير العام',
      icon: Crown,
      href: '/dashboard/super-admin',
      adminOnly: true
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'مدير عام'
      case 'DEVELOPER': return 'مطور النظام 👨‍💻'
      case 'SUB_ADMIN': return 'Operation'
      case 'CUSTOMER_SERVICE': return 'Customer Service'
      case 'USER': return 'مستخدم عادي'
      default: return role
    }
  }

  const renderNavItem = (item: NavItem) => {
    // ADMIN و DEVELOPER لديهم وصول كامل لكل شيء - بدون قيود
    if (user?.role === 'ADMIN' || user?.role === 'DEVELOPER' || user?.email === 'developer@system.local') {
      // عرض كل العناصر بدون أي قيود
    }
    // حماية خاصة لصفحة phone-numbers: فقط ADMIN و SALES
    else if (item.id === 'phone-numbers') {
      if (user?.role !== 'USER' && user?.role !== 'SALES') {
        return null
      }
    }
    // Hide admin-only items for non-admin users
    else if (item.adminOnly) {
      // Allow SUB_ADMIN to see CV-related items, contracts, and banners (NOT phone-numbers)
      if (user?.role === 'SUB_ADMIN') {
        const subAdminAllowedItems = ['add-cv', 'import-cv', 'smart-import', 'google-sheets', 'contracts', 'banners', 'secondary-banners']
        if (!subAdminAllowedItems.includes(item.id)) {
          return null
        }
      }
      // Allow CUSTOMER_SERVICE to see contracts only (NOT phone-numbers)
      else if (user?.role === 'CUSTOMER_SERVICE') {
        const customerServiceAllowedItems = ['contracts']
        if (!customerServiceAllowedItems.includes(item.id)) {
          return null
        }
      }
      // Hide from regular users
      else {
        return null
      }
    }

    const hasChildren = item.children && item.children.length > 0
    const active = item.href ? isActive(item.href) : false

    if (hasChildren) {
      return (
        <Collapsible key={item.id} defaultOpen={item.id === 'cvs'} className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.label}>
                <item.icon />
                <span>{item.label}</span>
                <ChevronRight className="mr-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.children?.map((child) => {
                  if (child.adminOnly) {
                    // DEVELOPER has full access to everything
                    if (user?.role === 'DEVELOPER' || user?.email === 'developer@system.local') {
                      // Developer sees everything - no restrictions
                    }
                    // Allow SUB_ADMIN to see CV-related items and contracts
                    else if (user?.role === 'SUB_ADMIN') {
                      const subAdminAllowedItems = ['add-cv', 'import-cv', 'smart-import', 'google-sheets', 'add-contract', 'all-contracts', 'old-contracts']
                      if (!subAdminAllowedItems.includes(child.id)) {
                        return null
                      }
                    }
                    // Allow CUSTOMER_SERVICE to see contracts only
                    else if (user?.role === 'CUSTOMER_SERVICE') {
                      const customerServiceAllowedItems = ['add-contract', 'all-contracts', 'old-contracts']
                      if (!customerServiceAllowedItems.includes(child.id)) {
                        return null
                      }
                    }
                    // Hide from regular users
                    else if (user?.role !== 'ADMIN') {
                      return null
                    }
                  }
                  const childActive = child.href ? isActive(child.href) : false
                  return (
                    <SidebarMenuSubItem key={child.id}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={childActive}
                        onClick={() => child.href && router.push(child.href)}
                      >
                        <a>
                          <child.icon />
                          <span>{child.label}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      )
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          tooltip={item.label}
          isActive={active}
          onClick={() => {
            if (item.href) {
              router.push(item.href)
            } else if (item.onClick) {
              item.onClick()
            }
          }}
        >
          <item.icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Sidebar collapsible="icon" side="right" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <FileText className="size-4" />
              </div>
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-semibold">مكاتب الاستقدام</span>
                <span className="truncate text-xs">لوحة التحكم</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => renderNavItem(item))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* زر تحكم النظام للمطور فقط */}
          {user && (user.role === 'DEVELOPER' || user.email === 'developer@system.local') && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={toggleSystemStatus}
                disabled={togglingSystem}
                className={`${
                  systemActive 
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400' 
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400'
                } transition-colors`}
              >
                {systemActive ? <Power className="size-4" /> : <PowerOff className="size-4" />}
                <span className="font-semibold">
                  {togglingSystem ? 'جاري التحديث...' : systemActive ? 'النظام مفعل' : 'النظام معطل'}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          
          {user && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-right text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-right text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-right text-sm leading-tight">
                        <span className="truncate font-semibold">{user.name}</span>
                        <span className="truncate text-xs">{getRoleText(user.role)}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className="ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
