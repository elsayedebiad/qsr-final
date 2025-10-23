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

    // جلب جميع الزيارات (آخر 1000 زيارة)
    const visits = await db.visit.findMany({
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

    return NextResponse.json({
      success: true,
      summary: {
        totalVisits,
        todayVisits,
        weekVisits,
        googleVisits,
        otherVisits
      },
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
