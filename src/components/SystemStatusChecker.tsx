'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SystemStatusCheckerProps {
  children: React.ReactNode
  userEmail?: string
  userRole?: string
}

/**
 * مكون للتحقق من حالة النظام
 * يتحقق من تفعيل حساب المطور ويوجه المستخدمين لصفحة الدفع إذا كان معطلاً
 */
export default function SystemStatusChecker({ children, userEmail, userRole }: SystemStatusCheckerProps) {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [systemActive, setSystemActive] = useState(true)

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    try {
      // المطور يمكنه الوصول دائماً - لا يتأثر بتعطيل النظام
      if (userEmail === 'developer@system.local' || userRole === 'DEVELOPER') {
        setIsChecking(false)
        setSystemActive(true)
        return
      }

      // التحقق من حالة النظام
      const response = await fetch('/api/system-status')
      const data = await response.json()

      if (!data.isActive) {
        // النظام معطل - منع الوصول لجميع المستخدمين (ما عدا المطور)
        // توجيه لصفحة الدفع
        router.push('/payment-required')
        return
      }

      setSystemActive(true)
    } catch (error) {
      console.error('Error checking system status:', error)
      // في حالة الخطأ، السماح بالوصول لتجنب تعطيل النظام
      setSystemActive(true)
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!systemActive) {
    return null // سيتم التوجيه لصفحة الدفع
  }

  return <>{children}</>
}
