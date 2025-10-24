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

      // محاولة جلب القواعد المخصصة من API
      try {
        const res = await fetch('/api/distribution/rules')
        const data = await res.json()
        
        if (data.success && data.rules && data.rules.length > 0) {
          // تعريف نوع القاعدة
          interface Rule {
            salesPageId: string
            googleWeight: number
            otherWeight: number
            isActive: boolean
          }
          
          // فلترة الصفحات النشطة فقط
          const activeRules = (data.rules as Rule[]).filter(r => r.isActive)
          
          // جلب قواعد Google - فقط الصفحات التي لها وزن > 0
          // إذا كتب المستخدم 0، لن تظهر الصفحة في القائمة = لن تحصل على زيارات
          const googleRules = activeRules
            .filter(r => r.googleWeight > 0)
            .map(r => ({
              path: `/sales${r.salesPageId.replace('sales', '')}`,
              weight: r.googleWeight
            }))
          
          // جلب قواعد Other - فقط الصفحات التي لها وزن > 0
          const otherRules = activeRules
            .filter(r => r.otherWeight > 0)
            .map(r => ({
              path: `/sales${r.salesPageId.replace('sales', '')}`,
              weight: r.otherWeight
            }))
          
          // استخدام القواعد المخصصة - حتى لو كانت النسب المجموعة ≠ 100%
          // النظام سيوزع حسب النسب النسبية للأوزان المحددة
          if (googleRules.length > 0) {
            GOOGLE_WEIGHTED = googleRules
            console.log('✅ Google distribution: Custom rules applied')
          } else {
            console.log('⚠️ Google distribution: No pages with weight > 0, using defaults')
          }
          
          if (otherRules.length > 0) {
            OTHER_WEIGHTED = otherRules
            console.log('✅ Other distribution: Custom rules applied')
          } else {
            console.log('⚠️ Other distribution: No pages with weight > 0, using defaults')
          }
          
          console.log('📊 Active Distribution Rules:')
          console.log('  Google pages:', GOOGLE_WEIGHTED.map(r => r.path + ' (' + r.weight + '%)'))
          console.log('  Other pages:', OTHER_WEIGHTED.map(r => r.path + ' (' + r.weight + '%)'))
          console.log('  Total Google weight:', GOOGLE_WEIGHTED.reduce((s, r) => s + r.weight, 0).toFixed(2) + '%')
          console.log('  Total Other weight:', OTHER_WEIGHTED.reduce((s, r) => s + r.weight, 0).toFixed(2) + '%')
        }
      } catch (error) {
        console.log('⚠️ API error - using default distribution rules:', error)
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
    const isFromGoogle = isGoogleRef(referer)
    const table = isFromGoogle ? GOOGLE_WEIGHTED : OTHER_WEIGHTED
    
    // التحقق من وجود صفحات متاحة
    if (table.length === 0) {
      console.error('❌ No available sales pages in distribution rules!')
      console.log('   Falling back to sales1')
      router.replace('/sales1' + window.location.search)
      return
    }
    
    const target = pickWeighted(table, randomValue).path
    console.log('🎯 Selected:', target, '(Source:', isFromGoogle ? 'Google' : 'Other', ')')

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
