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

      // محاولة جلب القواعد المخصصة - من API أولاً ثم من localStorage
      try {
        let rulesData = null;
        let dataSource = 'default';
        
             // محاولة 1: جلب من API العام (بدون authentication)
               try {
                 const res = await fetch('/api/distribution/public-rules')
                 const data = await res.json()
                 if (data.success && data.rules && data.rules.length > 0) {
                   rulesData = data.rules
                   dataSource = 'API'
                   console.log('✅ Rules loaded from public API')
                 }
               } catch (apiError) {
                 console.log('⚠️ API failed, checking localStorage...', apiError)
               }
        
        // محاولة 2: إذا فشل API، اقرأ من localStorage
        if (!rulesData) {
          const savedRules = localStorage.getItem('qsr_distribution_rules')
          if (savedRules) {
            try {
              const parsed = JSON.parse(savedRules)
              if (parsed.rules && parsed.rules.length > 0) {
                // تحويل القواعد من localStorage لنفس الشكل المتوقع
                interface LocalRule {
                  path: string
                  googleWeight: number
                  otherWeight: number
                  isActive?: boolean
                }
                rulesData = parsed.rules.map((rule: LocalRule) => ({
                  salesPageId: rule.path.replace('/sales', 'sales'),
                  googleWeight: rule.googleWeight || 0,
                  otherWeight: rule.otherWeight || 0,
                  isActive: rule.isActive !== false
                }))
                console.log('✅ Using rules from localStorage')
                dataSource = 'localStorage'
              }
            } catch (parseError) {
              console.error('Failed to parse localStorage rules:', parseError)
            }
          }
        }
        
        if (rulesData) {
          // تعريف نوع القاعدة
          interface Rule {
            salesPageId: string
            googleWeight: number
            otherWeight: number
            isActive: boolean
          }
          
          // ✅ الخطوة 1: فلترة الصفحات النشطة فقط (isActive = true)
          // الصفحات المعطلة لن تظهر هنا نهائياً
          const activeRules = (rulesData as Rule[]).filter(r => r.isActive)
          
          // ✅ الخطوة 2: جلب قواعد Google - فقط الصفحات التي لها وزن > 0
          // 🚫 القاعدة المهمة: إذا كتب المستخدم 0، لن تظهر الصفحة في القائمة
          // 🎯 النتيجة: الصفحة لن تحصل على أي زيارات Google (بدقة 100%)
          const googleRules = activeRules
            .filter(r => r.googleWeight > 0)  // ⚡ هنا يتم استبعاد القيم = 0
            .map(r => ({
              path: `/sales${r.salesPageId.replace('sales', '')}`,
              weight: r.googleWeight
            }))
          
          // ✅ الخطوة 3: جلب قواعد Other - فقط الصفحات التي لها وزن > 0
          // 🚫 نفس القاعدة: إذا كتب المستخدم 0، لن تظهر الصفحة
          // 🎯 النتيجة: الصفحة لن تحصل على أي زيارات Other (بدقة 100%)
          const otherRules = activeRules
            .filter(r => r.otherWeight > 0)  // ⚡ هنا يتم استبعاد القيم = 0
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
          console.log('  Total Active Rules:', activeRules.length)
          console.log('  Data source:', dataSource)
          
          // عرض تفاصيل كل صفحة نشطة
          console.log('  📋 Active Rules Detail:')
          activeRules.forEach(rule => {
            const isGoogleActive = rule.googleWeight > 0
            const isOtherActive = rule.otherWeight > 0
            const status = []
            if (isGoogleActive) status.push(`Google=${rule.googleWeight}%`)
            if (isOtherActive) status.push(`Other=${rule.otherWeight}%`)
            if (!isGoogleActive && !isOtherActive) status.push('❌ NO TRAFFIC')
            console.log(`    ${rule.salesPageId}: ${status.join(', ')}, Active=${rule.isActive}`)
          })
          
          console.log('  Google pages:', GOOGLE_WEIGHTED.map(r => r.path + ' (' + r.weight + '%)'))
          console.log('  Other pages:', OTHER_WEIGHTED.map(r => r.path + ' (' + r.weight + '%)'))
          
          // عرض الصفحات المستبعدة
          const googleExcluded = activeRules.filter(r => r.googleWeight === 0)
          const otherExcluded = activeRules.filter(r => r.otherWeight === 0)
          if (googleExcluded.length > 0) {
            console.log('  🚫 Google Excluded (weight=0):', googleExcluded.map(r => `/sales${r.salesPageId.replace('sales', '')}`))
          }
          if (otherExcluded.length > 0) {
            console.log('  🚫 Other Excluded (weight=0):', otherExcluded.map(r => `/sales${r.salesPageId.replace('sales', '')}`))
          }
          
          const googleTotal = GOOGLE_WEIGHTED.reduce((s, r) => s + r.weight, 0)
          const otherTotal = OTHER_WEIGHTED.reduce((s, r) => s + r.weight, 0)
          console.log('  Total Google weight:', googleTotal.toFixed(2) + '%')
          console.log('  Total Other weight:', otherTotal.toFixed(2) + '%')
          console.log('  ✅ Distribution is calculated proportionally - accuracy 100%')
          console.log('  📐 Example: weights [20, 30, 50] = distribution [20%, 30%, 50%]')
          console.log('  📐 Example: weights [10, 10, 10] = distribution [33.33%, 33.33%, 33.33%]')
        }
      } catch (error) {
        console.log('⚠️ API error - using default distribution rules:', error)
      }

    function pickWeighted<T extends { weight: number, path: string }>(items: T[], rnd: number): T {
      const total = items.reduce((s, i) => s + i.weight, 0)
      let cursor = rnd * total
      
      console.log('🎲 Weight Selection Debug:')
      console.log('  Total weight sum:', total)
      console.log('  Random value:', rnd)
      console.log('  Cursor start:', cursor)
      
      for (const it of items) {
        console.log(`  Checking ${it.path}: weight=${it.weight}, cursor=${cursor}`)
        if ((cursor -= it.weight) <= 0) {
          console.log(`  ✅ Selected: ${it.path}`)
          return it
        }
      }
      console.log(`  ⚠️ Fallback to last item: ${items[items.length - 1].path}`)
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
    const rulesVersion = 'v2' // نسخة القواعد لإلغاء الـ cookies القديمة
    const versionCookieName = 'td_rules_version'
    
    // التحقق من نسخة القواعد
    const existingVersion = document.cookie
      .split('; ')
      .find(row => row.startsWith(versionCookieName + '='))
    
    const currentVersion = existingVersion?.split('=')[1]
    
    // إذا تغيرت القواعد، امسح الـ cookie القديم
    let shouldResetCookie = false
    if (currentVersion !== rulesVersion) {
      shouldResetCookie = true
      document.cookie = `${versionCookieName}=${rulesVersion}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    }
    
    const existingCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(cookieName + '='))
    
    let randomValue: number
    
    // اختيار الجدول المناسب
    const isFromGoogle = isGoogleRef(referer)
    const table = isFromGoogle ? GOOGLE_WEIGHTED : OTHER_WEIGHTED
    
    // التحقق من وجود صفحات متاحة
    if (table.length === 0) {
      console.error('❌ No available sales pages in distribution rules!')
      console.log('   All pages have weight = 0 or are disabled')
      console.log('   Falling back to sales1')
      router.replace('/sales1' + window.location.search)
      return
    }
    
    // إذا كان لدينا cookie قديم، نتحقق أن الصفحة المحفوظة لا تزال نشطة
    if (existingCookie && !shouldResetCookie) {
      randomValue = parseFloat(existingCookie.split('=')[1])
      
      // التحقق أن الصفحة المختارة سابقاً لا تزال نشطة (قيمتها > 0)
      const previousTarget = pickWeighted(table, randomValue).path
      const isStillActive = table.some(item => item.path === previousTarget && item.weight > 0)
      
      if (!isStillActive) {
        // الصفحة المحفوظة لم تعد نشطة، اختر صفحة جديدة
        console.log('⚠️ Previous page no longer active, selecting new page...')
        randomValue = Math.random()
        document.cookie = `${cookieName}=${randomValue}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
      }
    } else {
      // لا يوجد cookie أو نحتاج إعادة تعيين
      randomValue = Math.random()
      // حفظ الكوكي لمدة 7 أيام (يمكن تقليلها إلى ساعة واحدة: 60 * 60)
      document.cookie = `${cookieName}=${randomValue}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`
    }
    
    const target = pickWeighted(table, randomValue).path
    const totalWeight = table.reduce((s, r) => s + r.weight, 0)
    const selectedWeight = table.find(r => r.path === target)?.weight || 0
    const actualPercentage = ((selectedWeight / totalWeight) * 100).toFixed(2)
    
    console.log('🎯 Distribution Result:')
    console.log('  Source:', isFromGoogle ? '📊 Google' : '🌍 Other')
    console.log('  Selected page:', target)
    console.log('  Page weight:', selectedWeight + '%')
    console.log('  Actual probability:', actualPercentage + '%')
    console.log('  Random value:', (randomValue * 100).toFixed(2) + '%')

    // استخراج UTM parameters ومعرفات الحملات الإعلانية
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    const utmCampaign = urlParams.get('utm_campaign')
    
    // معرفات الحملات الإعلانية
    const gclid = urlParams.get('gclid')        // Google Ads
    const fbclid = urlParams.get('fbclid')      // Facebook Ads
    const msclkid = urlParams.get('msclkid')    // Microsoft/Bing Ads
    const ttclid = urlParams.get('ttclid')      // TikTok Ads

    // معلومات الجهاز والشاشة
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const language = navigator.language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // تسجيل الزيارة مع جميع المعلومات
    fetch('/api/visits/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPage: target,
        referer,
        utmSource,
        utmMedium,
        utmCampaign,
        gclid,
        fbclid,
        msclkid,
        ttclid,
        isGoogle: isGoogleRef(referer),
        userAgent: navigator.userAgent,
        screenWidth,
        screenHeight,
        language,
        timezone
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
