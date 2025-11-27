/**
 * React Hook لتسجيل الأنشطة تلقائياً
 * يتتبع دخول وخروج الصفحات والإجراءات المختلفة
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

interface UseActivityLoggerOptions {
  pageName?: string
  autoLogPageView?: boolean
}

/**
 * Hook لتسجيل الأنشطة
 */
export function useActivityLogger(options: UseActivityLoggerOptions = {}) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { pageName, autoLogPageView = true } = options
  const pageViewLogged = useRef(false)
  const startTime = useRef<number>(Date.now())

  // تسجيل دخول الصفحة
  useEffect(() => {
    if (!user || !autoLogPageView || pageViewLogged.current) return

    // استثناء DEVELOPER من التسجيل
    if (user.role === 'DEVELOPER') {
      console.log('🚫 Activity logging disabled for DEVELOPER')
      return
    }

    const logPageView = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const pageTitle = pageName || document.title || pathname || 'صفحة غير معروفة'

        await fetch('/api/activity-log/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            pagePath: pathname,
            pageTitle,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          })
        })

        pageViewLogged.current = true
        console.log(`📄 Page view logged: ${pageTitle}`)
      } catch (error) {
        console.error('Error logging page view:', error)
      }
    }

    logPageView()
  }, [user, pathname, pageName, autoLogPageView])

  // تسجيل مدة البقاء في الصفحة عند الخروج
  useEffect(() => {
    if (!user || user.role === 'DEVELOPER') return

    const handleBeforeUnload = async () => {
      const duration = Math.floor((Date.now() - startTime.current) / 1000)
      
      // استخدام sendBeacon لإرسال البيانات حتى عند إغلاق الصفحة
      const token = localStorage.getItem('token')
      if (token) {
        const data = {
          pagePath: pathname,
          duration,
          action: 'PAGE_EXIT'
        }

        navigator.sendBeacon(
          '/api/activity-log/page-exit',
          new Blob([JSON.stringify({ ...data, token })], { type: 'application/json' })
        )
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [user, pathname])

  // دالة لتسجيل نشاط مخصص
  const logAction = async (action: string, description: string, metadata?: any) => {
    if (!user || user.role === 'DEVELOPER') return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await fetch('/api/activity-log/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          description,
          metadata,
          pagePath: pathname,
          timestamp: new Date().toISOString()
        })
      })

      console.log(`✅ Action logged: ${action}`)
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }

  // دالة لتسجيل رفع ملف
  const logFileUpload = async (fileName: string, fileSize: number, fileType: string) => {
    return logAction('FILE_UPLOAD', `رفع ملف: ${fileName}`, {
      fileName,
      fileSize,
      fileType
    })
  }

  // دالة لتسجيل تحميل ملف
  const logFileDownload = async (fileName: string, fileType: string) => {
    return logAction('FILE_DOWNLOAD', `تحميل ملف: ${fileName}`, {
      fileName,
      fileType
    })
  }

  // دالة لتسجيل بحث
  const logSearch = async (searchTerm: string, resultsCount: number) => {
    return logAction('SEARCH', `بحث عن: ${searchTerm}`, {
      searchTerm,
      resultsCount
    })
  }

  // دالة لتسجيل فلتر
  const logFilter = async (filterType: string, filterValue: any) => {
    return logAction('FILTER', `تطبيق فلتر: ${filterType}`, {
      filterType,
      filterValue
    })
  }

  // دالة لتسجيل نقرة على زر
  const logButtonClick = async (buttonName: string, buttonAction: string) => {
    return logAction('BUTTON_CLICK', `نقر على: ${buttonName}`, {
      buttonName,
      buttonAction
    })
  }

  return {
    logAction,
    logFileUpload,
    logFileDownload,
    logSearch,
    logFilter,
    logButtonClick,
    isLoggingEnabled: user && user.role !== 'DEVELOPER'
  }
}

export default useActivityLogger
