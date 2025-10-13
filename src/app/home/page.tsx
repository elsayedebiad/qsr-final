'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // التحقق من تسجيل الدخول والتوجيه للداشبورد
    const checkAuthAndRedirect = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData)
          // التوجيه حسب الدور
          if (user.role === 'DEVELOPER') {
            router.push('/developer-control')
          } else {
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error:', error)
          router.push('/')
        }
      } else {
        // غير مسجل، التوجيه للصفحة الرئيسية
        router.push('/')
      }
      
      setIsChecking(false)
    }

    checkAuthAndRedirect()
  }, [router])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return null
}
