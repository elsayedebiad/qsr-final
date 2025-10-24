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

    // جلب جميع الزيارات غير المؤرشفة (آخر 1000 زيارة)
    const visits = await db.visit.findMany({
      where: { isArchived: false },
      orderBy: { timestamp: 'desc' },
      take: 1000
    })

    // إحصائيات عامة
    const totalVisits = visits.length
    
    // عدد الزيارات لكل صفحة
    const pageStats = visits.reduce((acc, visit) => {
      acc[visit.targetPage] = (acc[visit.targetPage] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // عدد الزيارات لكل دولة
    const countryStats = visits.reduce((acc, visit) => {
      const country = visit.country || 'Unknown'
      acc[country] = (acc[country] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // عدد الزيارات من كل مصدر
    const sourceStats = visits.reduce((acc, visit) => {
      const source = visit.utmSource || (visit.isGoogle ? 'Google' : 'Direct')
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
      const pageVisits = visits.filter(v => v.targetPage === pageId)
      
      // حساب المصادر
      const sources = {
        google: pageVisits.filter(v => v.isGoogle).length,
        facebook: pageVisits.filter(v => v.utmSource?.toLowerCase().includes('facebook')).length,
        instagram: pageVisits.filter(v => v.utmSource?.toLowerCase().includes('instagram')).length,
        tiktok: pageVisits.filter(v => v.utmSource?.toLowerCase().includes('tiktok')).length,
        youtube: pageVisits.filter(v => v.utmSource?.toLowerCase().includes('youtube')).length,
        twitter: pageVisits.filter(v => v.utmSource?.toLowerCase().includes('twitter')).length,
        direct: pageVisits.filter(v => !v.utmSource && !v.isGoogle && (!v.referer || v.referer === '')).length,
        other: 0
      }
      
      // حساب "other" (الباقي)
      const knownSources = sources.google + sources.facebook + sources.instagram + sources.tiktok + sources.youtube + sources.twitter + sources.direct
      sources.other = pageVisits.length - knownSources
      
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
      recentVisits: visits.slice(0, 50) // آخر 50 زيارة
    })
  } catch (error) {
    console.error('Error fetching visit stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
