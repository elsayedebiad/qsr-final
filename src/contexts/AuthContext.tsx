'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  name: string
  role: string
  isActive: boolean
}

interface AuthContextType {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setIsLoggedIn(true)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsLoggedIn(false)
  }

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        setIsLoggedIn(false)
        setUser(null)
        setIsLoading(false)
        return
      }

      // محاولة التحقق من صحة الـ token مع timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds timeout

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store'
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setIsLoggedIn(true)
        } else {
          // لا نحذف الـ token فوراً، نعطي فرصة أخرى
          try {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            setIsLoggedIn(false) // نعتبره غير مسجل دخول لكن نحتفظ بالبيانات
          } catch {
            logout()
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        
        // تجاهل الأخطاء الناتجة عن Chrome Extensions
        if (fetchError?.message?.includes('chrome-extension') || 
            fetchError?.name === 'AbortError' ||
            fetchError?.message === 'Failed to fetch') {
          // استخدم البيانات المحلية المخزنة
          try {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            setIsLoggedIn(true) // نفترض أنه مسجل بناءً على البيانات المحلية
          } catch {
            logout()
          }
        } else {
          throw fetchError // إعادة رمي الأخطاء الأخرى
        }
      }
    } catch (error: any) {
      // تجاهل أخطاء Chrome Extensions في console
      if (!error?.message?.includes('chrome-extension')) {
        console.error('Auth check error:', error)
      }
      
      // في حالة خطأ الشبكة، نحتفظ بالبيانات المحلية
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          setIsLoggedIn(true) // استخدم البيانات المحلية
        } catch {
          logout()
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      isLoading,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
