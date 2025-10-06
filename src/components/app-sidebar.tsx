"use client"

import * as React from "react"
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
  icon: any
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
      case 'SUB_ADMIN': return 'Operation'
      case 'CUSTOMER_SERVICE': return 'Customer Service'
      case 'USER': return 'مستخدم عادي'
      default: return role
    }
  }

  const renderNavItem = (item: NavItem) => {
    // Hide admin-only items for non-admin users
    if (item.adminOnly) {
      // Allow SUB_ADMIN to see CV-related items only (add, import, smart-import, google-sheets)
      const subAdminAllowedItems = ['add-cv', 'import-cv', 'smart-import', 'google-sheets']
      if (user?.role === 'SUB_ADMIN' && !subAdminAllowedItems.includes(item.id)) {
        return null
      }
      // CUSTOMER_SERVICE cannot see any admin-only items
      if (user?.role === 'CUSTOMER_SERVICE') {
        return null
      }
      // Hide from regular users
      if (user?.role !== 'ADMIN' && user?.role !== 'SUB_ADMIN') {
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
                    // Allow SUB_ADMIN to see CV-related items only
                    const subAdminAllowedItems = ['add-cv', 'import-cv', 'smart-import', 'google-sheets']
                    if (user?.role === 'SUB_ADMIN' && !subAdminAllowedItems.includes(child.id)) {
                      return null
                    }
                    // CUSTOMER_SERVICE cannot see any admin-only items
                    if (user?.role === 'CUSTOMER_SERVICE') {
                      return null
                    }
                    // Hide from regular users
                    if (user?.role !== 'ADMIN' && user?.role !== 'SUB_ADMIN') {
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
                <span className="truncate font-semibold">نظام إدارة السير</span>
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
                  {user.role === 'ADMIN' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => {
                          localStorage.removeItem('system_activated')
                          window.location.reload()
                        }}
                      >
                        <Settings className="ml-2" />
                        إعادة تعيين التفعيل
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
