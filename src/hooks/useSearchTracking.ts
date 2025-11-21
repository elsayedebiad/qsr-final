import { useEffect, useRef } from 'react'

interface SearchFilters {
  searchTerm?: string
  nationality?: string
  position?: string
  ageFilter?: string
  experience?: string
  arabicLevel?: string
  englishLevel?: string
  maritalStatus?: string
  skills?: string[]
  religion?: string
  education?: string
  resultsCount?: number
}

// دالة لإنشاء ID فريد
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function useSearchTracking(salesPageId: string) {
  const sessionIdRef = useRef<string | undefined>()
  const lastTrackedRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | undefined>()

  useEffect(() => {
    // إنشاء session ID فريد عند التحميل
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trackSearch = async (filters: SearchFilters) => {
    // تجاهل إذا كانت الفلاتر فارغة تماماً
    const hasFilters = Object.values(filters).some(val => {
      if (Array.isArray(val)) return val.length > 0
      if (typeof val === 'string') return val && val !== 'ALL' && val.trim() !== ''
      return val !== undefined && val !== null
    })

    if (!hasFilters) return

    // إنشاء signature للفلاتر الحالية
    const filterSignature = JSON.stringify({
      ...filters,
      salesPageId
    })

    // تجنب التسجيل المتكرر لنفس الفلاتر
    if (filterSignature === lastTrackedRef.current) return

    lastTrackedRef.current = filterSignature

    // تأخير التسجيل قليلاً لتجنب الطلبات الكثيرة أثناء الكتابة
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/analytics/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            salesPageId,
            ...filters,
            sessionId: sessionIdRef.current
          })
        })
      } catch (error) {
        console.error('Error tracking search:', error)
      }
    }, 1000) // تأخير ثانية واحدة
  }

  return { trackSearch }
}
