'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // جلب قواعد التوزيع من API أو استخدام القيم الافتراضية
    async function redirect() {
      // القيم الافتراضية - توزيع متساوي على 11 صفحة (إجمالي 100%)
      let GOOGLE_WEIGHTED = [
        { path: '/sales1', weight: 9.09 },
        { path: '/sales2', weight: 9.09 },
        { path: '/sales3', weight: 9.09 },
        { path: '/sales4', weight: 9.09 },
        { path: '/sales5', weight: 9.09 },
        { path: '/sales6', weight: 9.09 },
        { path: '/sales7', weight: 9.09 },
        { path: '/sales8', weight: 9.09 },
        { path: '/sales9', weight: 9.09 },
        { path: '/sales10', weight: 9.09 },
        { path: '/sales11', weight: 9.01 },  // مع تعديل طفيف للوصول لـ 100%
      ]

      let OTHER_WEIGHTED = [
        { path: '/sales1', weight: 9.09 },
        { path: '/sales2', weight: 9.09 },
        { path: '/sales3', weight: 9.09 },
        { path: '/sales4', weight: 9.09 },
        { path: '/sales5', weight: 9.09 },
        { path: '/sales6', weight: 9.09 },
        { path: '/sales7', weight: 9.09 },
        { path: '/sales8', weight: 9.09 },
        { path: '/sales9', weight: 9.09 },
        { path: '/sales10', weight: 9.09 },
        { path: '/sales11', weight: 9.01 },
      ]

      // محاولة جلب القواعد من API
      try {
        const res = await fetch('/api/distribution/rules')
        const data = await res.json()
        
        if (data.success && data.rules) {
          // فلترة الصفحات النشطة فقط
          const activeRules = data.rules.filter((r: any) => r.isActive && (r.googleWeight > 0 || r.otherWeight > 0))
          
          GOOGLE_WEIGHTED = activeRules
            .filter((r: any) => r.googleWeight > 0)
            .map((r: any) => ({
              path: `/sales${r.salesPageId.replace('sales', '')}`,
              weight: r.googleWeight
            }))
          
          OTHER_WEIGHTED = activeRules
            .filter((r: any) => r.otherWeight > 0)
            .map((r: any) => ({
              path: `/sales${r.salesPageId.replace('sales', '')}`,
              weight: r.otherWeight
            }))
        }
      } catch (error) {
        console.log('Using default distribution rules:', error)
      }

    function pickWeighted<T extends { weight: number }>(items: T[], rnd: number): T {
      const total = items.reduce((s, i) => s + i.weight, 0)
      let cursor = rnd * total
      for (const it of items) {
        if ((cursor -= it.weight) <= 0) return it
      }
      return items[items.length - 1]
    }

    function isGoogleRef(ref: string): boolean {
      const GOOGLE_HINTS = [
        'google.com',
        'googleadservices.com',
        'g.doubleclick.net',
        'googlesyndication.com',
        'gclid=',
      ]
      const low = (ref || '').toLowerCase()
      return GOOGLE_HINTS.some((h) => low.includes(h))
    }

    // الحصول على referer
    const referer = document.referrer || ''
    
    // التحقق من الكوكي للثبات
    const cookieName = 'td_bucket'
    const existingCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(cookieName + '='))
    
    let randomValue: number
    if (existingCookie) {
      randomValue = parseFloat(existingCookie.split('=')[1])
    } else {
      randomValue = Math.random()
      // حفظ الكوكي لمدة 7 أيام
      document.cookie = `${cookieName}=${randomValue}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    }

    // اختيار الجدول المناسب
    const table = isGoogleRef(referer) ? GOOGLE_WEIGHTED : OTHER_WEIGHTED
    const target = pickWeighted(table, randomValue).path

    // استخراج UTM parameters
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    const utmCampaign = urlParams.get('utm_campaign')

    // تسجيل الزيارة
    fetch('/api/visits/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPage: target,
        referer,
        utmSource,
        utmMedium,
        utmCampaign,
        isGoogle: isGoogleRef(referer),
        userAgent: navigator.userAgent
      })
    }).catch(err => console.log('Track error:', err))

      // إعادة التوجيه مع الحفاظ على query parameters
      const params = window.location.search
      router.replace(target + params)
    }
    
    redirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">جاري التحويل...</p>
        <p className="text-gray-400 text-sm mt-2">Redirecting to sales page...</p>
      </div>
    </div>
  )
}
