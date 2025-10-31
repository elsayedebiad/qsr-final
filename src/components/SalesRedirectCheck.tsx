'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

/**
 * مكون للتحقق من أن الزائر مر بنظام التوزيع
 * إذا دخل مباشرة على الصفحة من خارج الموقع، سيتم إعادة توجيهه لـ /sales أولاً
 */
export default function SalesRedirectCheck() {
  const router = useRouter()
  const pathname = usePathname()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // التحقق من أن الزائر ليس من داخل الموقع
    const isInternalNavigation = document.referrer && document.referrer.includes(window.location.hostname)
    
    // التحقق من وجود كوكي التوزيع
    const hasDistributionCookie = document.cookie.includes('td_bucket=')
    
    // التحقق من أنه ليس redirect من /sales نفسها
    const isComingFromSales = document.referrer && document.referrer.includes('/sales')
    
    // إذا لم يكن هناك كوكي توزيع ولم يأتي من داخل الموقع ولا من /sales
    if (!hasDistributionCookie && !isInternalNavigation && !isComingFromSales) {
      console.log('🔄 External visitor without distribution cookie detected')
      console.log('   Redirecting to /sales for proper distribution...')
      console.log('   Referrer:', document.referrer || 'Direct')
      console.log('   Current page:', pathname)
      console.log('   Has cookie:', hasDistributionCookie)
      console.log('   Is internal:', isInternalNavigation)
      
      setShouldRedirect(true)
      
      // الحفاظ على query parameters
      const params = window.location.search
      
      // إعادة التوجيه إلى /sales مع الحفاظ على المعاملات
      // استخدام window.location بدلاً من router.replace لضمان التوجيه الفوري
      window.location.href = '/sales' + params
    } else {
      console.log('✅ Distribution check passed')
      console.log('   Has cookie:', hasDistributionCookie)
      console.log('   Is internal:', isInternalNavigation)
      console.log('   From /sales:', isComingFromSales)
    }
  }, [router, pathname])

  // عرض شاشة تحميل أثناء إعادة التوجيه
  if (shouldRedirect) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري التحميل...</p>
          <p className="text-gray-400 text-sm mt-2">Redirecting...</p>
        </div>
      </div>
    )
  }

  return null
}
