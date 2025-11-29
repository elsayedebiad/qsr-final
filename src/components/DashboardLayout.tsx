'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { Menu, Sun, Moon } from 'lucide-react'
import UserHeartbeat from './UserHeartbeat'
import ContractAlertsNotification from './ContractAlertsNotification'
import GlobalNotifications from './GlobalNotifications'
import { useActivityLogger } from '@/hooks/useActivityLogger'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface DashboardLayoutProps {
  children: React.ReactNode | ((user: User | null) => React.ReactNode)
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const router = useRouter()
  const pathname = usePathname()

  // تسجيل زيارات الصفحات تلقائياً لجميع المستخدمين ما عدا المطور
  useActivityLogger({
    autoLogPageView: true
  })

  useEffect(() => {
    setIsMounted(true)
    checkAuth()

    // Load theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const preferredTheme = savedTheme || 'dark'
    setTheme(preferredTheme)
  }, [])

  // التحقق من حالة النظام عند تغيير المسار
  useEffect(() => {
    if (user) {
      checkSystemStatus()
    }
  }, [pathname, user])

  const checkSystemStatus = async () => {
    try {
      // المطور يمكنه الوصول دائماً - لا يتأثر بتعطيل النظام
      if (user?.email === 'developer@system.local' || user?.role === 'DEVELOPER') {
        return
      }

      // التحقق من حالة النظام
      const systemStatusResponse = await fetch('/api/system-status')
      if (systemStatusResponse.ok) {
        const systemData = await systemStatusResponse.json()
        if (!systemData.isActive) {
          // النظام معطل - منع الوصول فوراً
          router.push('/payment-required')
          return
        }
      }
    } catch (error) {
      console.error('Error checking system status:', error)
    }
  }

  const checkAuth = async () => {
    if (typeof window === 'undefined') return // Skip on server-side

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)

        // التحقق من حالة النظام (تعطيل المطور)
        // المطور يمكنه الوصول دائماً
        if (data.user.email !== 'developer@system.local' && data.user.role !== 'DEVELOPER') {
          const systemStatusResponse = await fetch('/api/system-status')
          if (systemStatusResponse.ok) {
            const systemData = await systemStatusResponse.json()
            if (!systemData.isActive) {
              // النظام معطل - توجيه لصفحة الدفع
              router.push('/payment-required')
              return
            }
          }
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/login')
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (typeof window === 'undefined') return // Skip on server-side

    const sessionId = localStorage.getItem('sessionId')

    // Notify server about logout
    if (sessionId) {
      try {
        const token = localStorage.getItem('token')
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        })
      } catch (error) {
        console.error('Logout notification failed:', error)
      }
    }

    localStorage.removeItem('token'
    )
    localStorage.removeItem('user')
    localStorage.removeItem('sessionId')
    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/login')
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'

    // إنشاء overlay للتأثير البصري على الصفحة بأكملها
    const overlay = document.createElement('div')
    overlay.className = 'theme-transition-overlay'
    document.body.appendChild(overlay)

    // تفعيل الـ overlay
    requestAnimationFrame(() => {
      overlay.classList.add('active')
    })

    // إضافة كلاس transitioning للحصول على تأثير سلس
    const root = document.documentElement
    root.classList.add('theme-transitioning')

    // تطبيق الثيم الجديد بعد 80ms للسماح بالـ overlay (مُحسّن)
    setTimeout(() => {
      setTheme(newTheme)

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
    }, 80)

    // إزالة الـ overlay والـ transitioning class بعد انتهاء الأنيميشن (مُحسّن)
    setTimeout(() => {
      overlay.classList.remove('active')
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay)
        }
      }, 250)
    }, 150)

    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 450)
  }

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <SidebarProvider>
      <UserHeartbeat />
      <ContractAlertsNotification />
      <GlobalNotifications />
      <AppSidebar user={user} onLogout={handleLogout} />
      <main className="flex flex-1 flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b border-border bg-background px-3 sm:px-6">
          <SidebarTrigger className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
            <Menu className="h-5 w-5 text-foreground" />
          </SidebarTrigger>
          <h1 className="text-base sm:text-xl font-bold truncate flex-1">نظام إدارة مكاتب الاستقدام</h1>

          {/* Theme Toggle Button with Professional Animation */}
          <button
            onClick={toggleTheme}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-accent hover:scale-105 active:scale-95 group overflow-hidden"
            title={theme === 'dark' ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
          >
            {/* Ripple Effect Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            {/* Icon with Rotation Animation */}
            <div className="relative z-10 transition-transform duration-500 group-hover:rotate-180">
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500 drop-shadow-lg" />
              ) : (
                <Moon className="h-5 w-5 text-slate-700 drop-shadow-lg" />
              )}
            </div>

            <span className="hidden sm:inline text-sm font-medium relative z-10">
              {theme === 'dark' ? 'الوضع الفاتح' : 'الوضع المظلم'}
            </span>
          </button>
        </header>
        <div className="flex-1 p-3 sm:p-6">
          {typeof children === 'function' ? children(user) : children}
        </div>
      </main>
    </SidebarProvider>
  )
}
