// تسجيل عمليات البحث والفلاتر في صفحات المبيعات

interface SearchAnalyticsParams {
  salesPageId: string
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

let sessionId: string | null = null
let lastLoggedFilters: string | null = null
let debounceTimer: NodeJS.Timeout | null = null

// توليد session ID فريد للجلسة
function getSessionId(): string {
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  return sessionId
}

// تسجيل عملية البحث/الفلترة
export async function logSearchAnalytics(params: SearchAnalyticsParams): Promise<void> {
  try {
    // إنشاء مفتاح للفلاتر الحالية لتجنب التكرار
    const filterKey = JSON.stringify({
      searchTerm: params.searchTerm || '',
      nationality: params.nationality || '',
      position: params.position || '',
      ageFilter: params.ageFilter || '',
      experience: params.experience || '',
      arabicLevel: params.arabicLevel || '',
      englishLevel: params.englishLevel || '',
      maritalStatus: params.maritalStatus || '',
      skills: (params.skills || []).sort().join(','),
      religion: params.religion || '',
      education: params.education || ''
    })

    // تجنب تسجيل نفس الفلاتر مرتين متتاليتين
    if (filterKey === lastLoggedFilters) {
      return
    }

    lastLoggedFilters = filterKey

    // إلغاء المؤقت السابق إذا كان موجوداً
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // تأجيل التسجيل لمدة 1 ثانية لتجنب الكثير من الطلبات
    debounceTimer = setTimeout(async () => {
      const response = await fetch('/api/analytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          sessionId: getSessionId(),
        }),
      })

      if (!response.ok) {
        console.error('Failed to log search analytics')
      }
    }, 1000)
  } catch (error) {
    console.error('Error logging search analytics:', error)
  }
}

// تسجيل عند تحميل الصفحة (بدون فلاتر)
export async function logPageView(salesPageId: string, totalCVs: number): Promise<void> {
  try {
    await fetch('/api/analytics/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        salesPageId,
        resultsCount: totalCVs,
        sessionId: getSessionId(),
      }),
    })
  } catch (error) {
    console.error('Error logging page view:', error)
  }
}
