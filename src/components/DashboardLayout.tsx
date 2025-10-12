'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { Menu } from 'lucide-react'

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
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
    checkAuth()
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

  const handleLogout = () => {
    if (typeof window === 'undefined') return // Skip on server-side
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/login')
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
      <AppSidebar user={user} onLogout={handleLogout} />
      <main className="flex flex-1 flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b border-border bg-background px-3 sm:px-6">
          <SidebarTrigger className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
            <Menu className="h-5 w-5 text-foreground" />
          </SidebarTrigger>
          <h1 className="text-base sm:text-xl font-bold truncate">نظام إدارة السير الذاتية</h1>
        </header>
        <div className="flex-1 p-3 sm:p-6">
          {typeof children === 'function' ? children(user) : children}
        </div>
      </main>
    </SidebarProvider>
  )
}
