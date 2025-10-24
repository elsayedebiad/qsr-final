import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم (ADMIN والـ DEVELOPER فقط)
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    // التحقق من أن المستخدم ADMIN أو DEVELOPER
    const allowedRoles = ['ADMIN', 'DEVELOPER']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'غير مصرح - هذه الصفحة للمدير والمطور فقط' },
        { status: 403 }
      )
    }

    // الحصول على معاملات الـ pagination والفلاتر من الـ query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    
    // الحصول على الفلاتر
    const countryFilter = searchParams.get('country')
    const pageFilterParam = searchParams.get('targetPage')
    const campaignFilter = searchParams.get('campaign')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // بناء where condition للفلاتر
    const whereCondition: any = { isArchived: false }
    
    if (countryFilter) {
      whereCondition.country = countryFilter
    }
    
    if (pageFilterParam) {
      // تنظيف اسم الصفحة
      const cleanPage = pageFilterParam.trim().toLowerCase().replace(/^\/+/, '')
      whereCondition.targetPage = {
        contains: cleanPage,
        mode: 'insensitive'
      }
    }
    
    if (campaignFilter) {
      if (campaignFilter === 'No Campaign') {
        whereCondition.utmCampaign = null
      } else {
        whereCondition.utmCampaign = campaignFilter
      }
    }
    
    if (dateFrom || dateTo) {
      whereCondition.timestamp = {}
      if (dateFrom) {
        whereCondition.timestamp.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        whereCondition.timestamp.lte = toDate
      }
    }

    // عد إجمالي الزيارات حسب الفلاتر
    const totalVisitsCount = await db.visit.count({
      where: whereCondition
    })

    // جلب جميع الزيارات حسب الفلاتر للإحصائيات
    const visits = await db.visit.findMany({
      where: whereCondition,
      orderBy: { id: 'desc' },
      take: 1000 // للإحصائيات
    })

    // جلب الزيارات للصفحة الحالية حسب الفلاتر
    const paginatedVisits = await db.visit.findMany({
      where: whereCondition,
      orderBy: { id: 'desc' },
      skip,
      take: limit
    })

    // إحصائيات عامة
    const totalVisits = visits.length
    
    // عدد الزيارات لكل صفحة (مع تنظيف ودمج أسماء الصفحات المكررة)
    const pageStatsRaw = visits.reduce((acc, visit) => {
      // تنظيف اسم الصفحة: إزالة / من البداية، المسافات، وتحويل لأحرف صغيرة
      const cleanPage = visit.targetPage.trim().toLowerCase().replace(/^\/+/, '')
      acc[cleanPage] = (acc[cleanPage] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // دمج الصفحات المتشابهة (sales1, Sales1, SALES1، إلخ)
    const pageStats = Object.entries(pageStatsRaw).reduce((acc, [page, count]) => {
      // البحث عن مفتاح موجود بنفس الاسم (بعد التنظيف)
      const normalizedPage = page.trim().toLowerCase()
      const existingKey = Object.keys(acc).find(key => key.toLowerCase() === normalizedPage)
      
      if (existingKey) {
        // إذا وجدنا مفتاح مطابق، نضيف العدد إليه
        acc[existingKey] += count
      } else {
        // إذا لم نجد، نضيف المفتاح الجديد
        acc[normalizedPage] = count
      }
      
      return acc
    }, {} as Record<string, number>)

    // عدد الزيارات لكل دولة (مع تنظيف ودمج أسماء الدول المكررة)
    const countryStatsRaw = visits.reduce((acc, visit) => {
      // تنظيف اسم الدولة: إزالة المسافات الزائدة
      const country = (visit.country || 'Unknown').trim()
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // دمج الدول المتشابهة (مع اختلافات في الحالة أو المسافات)
    const countryStats = Object.entries(countryStatsRaw).reduce((acc, [country, count]) => {
      // البحث عن مفتاح موجود بنفس الاسم (بعد التنظيف)
      const normalizedCountry = country.trim()
      const existingKey = Object.keys(acc).find(key => 
        key.trim().toLowerCase() === normalizedCountry.toLowerCase()
      )
      
      if (existingKey) {
        // إذا وجدنا مفتاح مطابق، نضيف العدد إليه
        acc[existingKey] += count
      } else {
        // إذا لم نجد، نضيف المفتاح الجديد
        acc[normalizedCountry] = count
      }
      
      return acc
    }, {} as Record<string, number>)

    // عدد الزيارات من كل مصدر - بدقة 100%
    const sourceStats = visits.reduce((acc, visit) => {
      let source = 'Direct' // القيمة الافتراضية
      
      // الأولوية 1: فحص معرفات الإعلانات (أدق طريقة)
      if (visit.gclid) {
        source = 'Google Ads'
      } else if (visit.fbclid) {
        source = 'Facebook Ads'
      } else if (visit.msclkid) {
        source = 'Microsoft Ads'
      } else if (visit.ttclid) {
        source = 'TikTok Ads'
      }
      // الأولوية 2: فحص utmSource (إذا وُجد)
      else if (visit.utmSource) {
        source = visit.utmSource
      }
      // الأولوية 3: فحص isGoogle flag
      else if (visit.isGoogle) {
        source = 'Google Organic'
      }
      // الأولوية 4: فحص referer إذا كان موجود
      else if (visit.referer && visit.referer.trim() !== '') {
        const refLower = visit.referer.toLowerCase()
        if (refLower.includes('google')) source = 'Google'
        else if (refLower.includes('facebook')) source = 'Facebook'
        else if (refLower.includes('instagram')) source = 'Instagram'
        else if (refLower.includes('tiktok')) source = 'TikTok'
        else if (refLower.includes('youtube')) source = 'YouTube'
        else if (refLower.includes('twitter') || refLower.includes('t.co')) source = 'Twitter'
        else source = 'Referral'
      }
      
      // Log للتأكد من دقة البيانات (مؤقت للتشخيص)
      // 🔕 تم إيقاف الـ log - يمكن تفعيله للتشخيص
      // if (source === 'Twitter' || (visit.utmSource && visit.utmSource.toLowerCase().includes('twitter'))) {
      //   console.log('⚠️ Twitter Visit Detected:', {
      //     utmSource: visit.utmSource,
      //     referer: visit.referer,
      //     utmCampaign: visit.utmCampaign,
      //     id: visit.id
      //   })
      // }
      
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // عدد الزيارات من Google vs Others
    const googleVisits = visits.filter(v => v.isGoogle).length
    const otherVisits = totalVisits - googleVisits

    // الزيارات اليوم
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayVisits = visits.filter(v => new Date(v.timestamp) >= today).length

    // الزيارات هذا الأسبوع
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekVisits = visits.filter(v => new Date(v.timestamp) >= weekAgo).length

    // الزيارات حسب الحملة
    const campaignStats = visits.reduce((acc, visit) => {
      const campaign = visit.utmCampaign || 'No Campaign'
      acc[campaign] = (acc[campaign] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // بناء إحصائيات مفصلة لكل صفحة
    const salesPages = ['sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6', 'sales7', 'sales8', 'sales9', 'sales10', 'sales11']
    
    const visitStats = salesPages.map(pageId => {
      // تنظيف targetPage للمقارنة - إزالة / من البداية والمسافات
      const pageVisits = visits.filter(v => {
        const cleanTarget = v.targetPage.trim().toLowerCase().replace(/^\/+/, '')
        return cleanTarget === pageId
      })
      
      // حساب المصادر بدقة 100% - باستخدام نفس منطق sourceStats
      const sources = {
        google: 0,
        facebook: 0,
        instagram: 0,
        tiktok: 0,
        youtube: 0,
        twitter: 0,
        direct: 0,
        other: 0
      }
      
      pageVisits.forEach(visit => {
        // استخدام نفس المنطق الدقيق من sourceStats
        // فحص معرفات الإعلانات
        if (visit.gclid) {
          sources.google++
        } else if (visit.fbclid) {
          sources.facebook++
        } else if (visit.ttclid) {
          sources.tiktok++
        }
        // فحص utmSource
        else if (visit.utmSource) {
          const sourceLower = visit.utmSource.toLowerCase()
          if (sourceLower.includes('google')) {
            sources.google++
          } else if (sourceLower.includes('facebook')) {
            sources.facebook++
          } else if (sourceLower.includes('instagram')) {
            sources.instagram++
          } else if (sourceLower.includes('tiktok')) {
            sources.tiktok++
          } else if (sourceLower.includes('youtube')) {
            sources.youtube++
          } else if (sourceLower.includes('twitter')) {
            sources.twitter++
          } else {
            sources.other++
          }
        }
        // فحص isGoogle flag
        else if (visit.isGoogle) {
          sources.google++
        }
        // فحص referer
        else if (visit.referer && visit.referer.trim() !== '') {
          const refLower = visit.referer.toLowerCase()
          if (refLower.includes('google')) {
            sources.google++
          } else if (refLower.includes('facebook')) {
            sources.facebook++
          } else if (refLower.includes('instagram')) {
            sources.instagram++
          } else if (refLower.includes('tiktok')) {
            sources.tiktok++
          } else if (refLower.includes('youtube')) {
            sources.youtube++
          } else if (refLower.includes('twitter') || refLower.includes('t.co')) {
            sources.twitter++
          } else {
            sources.other++
          }
        }
        // Direct (لا يوجد أي مصدر)
        else {
          sources.direct++
        }
      })
      
      // الزيارات اليوم
      const todayVisits = pageVisits.filter(v => new Date(v.timestamp) >= today).length
      
      // الزيارات أمس
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayVisits = pageVisits.filter(v => {
        const visitDate = new Date(v.timestamp)
        return visitDate >= yesterday && visitDate < today
      }).length
      
      // الزيارات هذا الأسبوع
      const thisWeekVisits = pageVisits.filter(v => new Date(v.timestamp) >= weekAgo).length
      
      // الزيارات هذا الشهر
      const monthAgo = new Date()
      monthAgo.setDate(monthAgo.getDate() - 30)
      const thisMonthVisits = pageVisits.filter(v => new Date(v.timestamp) >= monthAgo).length
      
      return {
        salesPageId: pageId,
        totalVisits: pageVisits.length,
        sources,
        today: todayVisits,
        yesterday: yesterdayVisits,
        thisWeek: thisWeekVisits,
        thisMonth: thisMonthVisits
      }
    })

    // تنظيف البيانات المرسلة: تنظيف targetPage في recentVisits
    const cleanedRecentVisits = paginatedVisits.map(visit => ({
      ...visit,
      targetPage: visit.targetPage.trim().toLowerCase().replace(/^\/+/, ''),
      country: (visit.country || 'Unknown').trim()
    }))

    // جلب جميع الخيارات المتاحة للفلاتر (بدون فلتر) لعرضها في القوائم المنسدلة
    const allVisitsForFilters = await db.visit.findMany({
      where: { isArchived: false },
      select: {
        country: true,
        targetPage: true,
        utmCampaign: true
      }
    })

    // بناء قوائم الفلاتر من جميع البيانات
    const allCountries = Array.from(new Set(
      allVisitsForFilters
        .map(v => (v.country || 'Unknown').trim())
        .filter(c => c && c !== '')
    )).sort()

    const allPages = Array.from(new Set(
      allVisitsForFilters
        .map(v => v.targetPage.trim().toLowerCase().replace(/^\/+/, ''))
        .filter(p => p && p !== '')
    )).sort()

    const allCampaigns = Array.from(new Set(
      allVisitsForFilters
        .map(v => v.utmCampaign || 'No Campaign')
    )).sort()

    return NextResponse.json({
      success: true,
      summary: {
        totalVisits,
        todayVisits,
        weekVisits,
        googleVisits,
        otherVisits
      },
      visitStats, // البيانات بالشكل المطلوب لصفحة distribution
      pageStats,
      countryStats,
      sourceStats,
      campaignStats,
      // قوائم الفلاتر من جميع البيانات
      filterOptions: {
        countries: allCountries,
        pages: allPages,
        campaigns: allCampaigns
      },
      recentVisits: cleanedRecentVisits, // الزيارات المقسمة حسب الصفحة بعد التنظيف
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalVisitsCount / limit),
        totalItems: totalVisitsCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalVisitsCount / limit),
        hasPreviousPage: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching visit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
