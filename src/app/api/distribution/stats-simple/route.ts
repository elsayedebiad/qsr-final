import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET: إحصائيات التوزيع البسيطة
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const salesPages = [
      'sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6',
      'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
    ]

    // جلب عدد السير في كل صفحة من ActivityLog
    const pageStats = await Promise.all(
      salesPages.map(async (pageId) => {
        // عد السير من سجل الأنشطة (التوزيع)
        const distributions = await db.activityLog.findMany({
          where: {
            action: 'CV_DISTRIBUTED',
            metadata: {
              path: '$.salesPageId',
              equals: pageId
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        })

        // عد السير المحذوفة
        const removals = await db.activityLog.findMany({
          where: {
            action: 'CV_REMOVED',
            metadata: {
              path: '$.salesPageId',
              equals: pageId
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        })

        // حساب السير النشطة (موزعة - محذوفة)
        const activeCount = distributions.length - removals.length

        // عد أنشطة اليوم
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayAssigned = distributions.filter(d => 
          new Date(d.createdAt) >= today
        ).length

        const todayRemoved = removals.filter(r => 
          new Date(r.createdAt) >= today
        ).length

        return {
          salesPageId: pageId,
          activeCount: Math.max(0, activeCount),
          todayAssigned,
          todayRemoved,
          dailyLimit: 100,
          totalLimit: 1000,
          autoDistribute: false,
          isActive: true,
          statusCounts: {
            NEW: 0,
            BOOKED: 0,
            HIRED: 0,
            REJECTED: 0,
            RETURNED: 0,
            ARCHIVED: 0
          }
        }
      })
    )

    // حساب الإجمالي
    const totalActive = pageStats.reduce((sum, stat) => sum + stat.activeCount, 0)
    const totalTodayAssigned = pageStats.reduce((sum, stat) => sum + stat.todayAssigned, 0)
    const totalTodayRemoved = pageStats.reduce((sum, stat) => sum + stat.todayRemoved, 0)
    const averagePerPage = Math.round(totalActive / salesPages.length)

    // الصفحات الأكثر نشاطاً
    const topPages = [...pageStats]
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 5)
      .map(p => ({
        salesPageId: p.salesPageId,
        activeCount: p.activeCount,
        percentage: totalActive > 0 ? Math.round((p.activeCount / totalActive) * 100) : 0
      }))

    return NextResponse.json({
      success: true,
      summary: {
        totalActive,
        totalTodayAssigned,
        totalTodayRemoved,
        averagePerPage,
        topPages
      },
      pageStats
    })
  } catch (error) {
    console.error('Distribution stats error:', error)
    return NextResponse.json(
      { error: 'فشل جلب إحصائيات التوزيع' },
      { status: 500 }
    )
  }
}
