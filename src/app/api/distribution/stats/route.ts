import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'

const prisma = new PrismaClient()

// GET: جلب إحصائيات التوزيع
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const salesPageId = searchParams.get('salesPageId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // إحصائيات عامة لكل صفحة
    const salesPages = [
      'sales1', 'sales2', 'sales3', 'sales4', 'sales5', 'sales6',
      'sales7', 'sales8', 'sales9', 'sales10', 'sales11'
    ]

    // إحصائيات حالية لكل صفحة
    const currentStats = await Promise.all(
      salesPages.map(async (pageId) => {
        const activeCount = await prisma.cVDistribution.count({
          where: {
            salesPageId: pageId,
            isActive: true
          }
        })

        const todayDate = new Date()
        todayDate.setHours(0, 0, 0, 0)

        const todayStats = await prisma.distributionStats.findFirst({
          where: {
            salesPageId: pageId,
            date: todayDate
          }
        })

        const rule = await prisma.distributionRule.findUnique({
          where: { salesPageId: pageId }
        })

        // جلب معلومات السير الموزعة
        const distributions = await prisma.cVDistribution.findMany({
          where: {
            salesPageId: pageId,
            isActive: true
          },
          include: {
            cv: {
              select: {
                id: true,
                fullName: true,
                nationality: true,
                position: true,
                status: true
              }
            }
          },
          take: 10,
          orderBy: { assignedAt: 'desc' }
        })

        // عد السير حسب الحالة
        const statusCounts = await prisma.cV.groupBy({
          by: ['status'],
          where: {
            distributions: {
              some: {
                salesPageId: pageId,
                isActive: true
              }
            }
          },
          _count: true
        })

        const statusMap = statusCounts.reduce((acc, curr) => {
          acc[curr.status] = curr._count
          return acc
        }, {} as Record<string, number>)

        return {
          salesPageId: pageId,
          activeCount,
          todayAssigned: todayStats?.totalAssigned || 0,
          todayRemoved: todayStats?.totalRemoved || 0,
          dailyLimit: rule?.dailyLimit || null,
          totalLimit: rule?.totalLimit || null,
          autoDistribute: rule?.autoDistribute || false,
          isActive: rule?.isActive || false,
          statusCounts: {
            NEW: statusMap['NEW'] || 0,
            BOOKED: statusMap['BOOKED'] || 0,
            HIRED: statusMap['HIRED'] || 0,
            REJECTED: statusMap['REJECTED'] || 0,
            RETURNED: statusMap['RETURNED'] || 0,
            ARCHIVED: statusMap['ARCHIVED'] || 0
          },
          recentDistributions: distributions.map(d => ({
            cvId: d.cv.id,
            name: d.cv.fullName,
            nationality: d.cv.nationality,
            position: d.cv.position,
            status: d.cv.status,
            assignedAt: d.assignedAt
          }))
        }
      })
    )

    // إحصائيات تاريخية إذا طُلبت
    let historicalStats = []
    if (dateFrom || dateTo) {
      const where: any = {}
      if (salesPageId) where.salesPageId = salesPageId
      if (dateFrom || dateTo) {
        where.date = {}
        if (dateFrom) where.date.gte = new Date(dateFrom)
        if (dateTo) where.date.lte = new Date(dateTo)
      }

      historicalStats = await prisma.distributionStats.findMany({
        where,
        orderBy: [
          { salesPageId: 'asc' },
          { date: 'desc' }
        ]
      })
    }

    // إجمالي النظام
    const totalActive = currentStats.reduce((sum, stat) => sum + stat.activeCount, 0)
    const totalTodayAssigned = currentStats.reduce((sum, stat) => sum + stat.todayAssigned, 0)
    const totalTodayRemoved = currentStats.reduce((sum, stat) => sum + stat.todayRemoved, 0)

    // الصفحات الأكثر نشاطاً
    const topPages = [...currentStats]
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 5)
      .map(p => ({
        salesPageId: p.salesPageId,
        activeCount: p.activeCount,
        percentage: Math.round((p.activeCount / totalActive) * 100)
      }))

    return NextResponse.json({
      success: true,
      summary: {
        totalActive,
        totalTodayAssigned,
        totalTodayRemoved,
        averagePerPage: Math.round(totalActive / salesPages.length),
        topPages
      },
      pageStats: currentStats,
      historicalStats
    })
  } catch (error) {
    console.error('Distribution stats error:', error)
    return NextResponse.json(
      { error: 'فشل جلب إحصائيات التوزيع' },
      { status: 500 }
    )
  }
}
