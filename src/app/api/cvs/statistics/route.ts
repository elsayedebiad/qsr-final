import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    // التحقق من التوكن
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // حساب التواريخ
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // جلب الإحصائيات
    const [
      totalCVs,
      newToday,
      updatedToday,
      newThisWeek,
      updatedThisWeek,
      newThisMonth,
      updatedThisMonth,
      statusCounts
    ] = await Promise.all([
      // إجمالي السير
      prisma.cV.count(),
      
      // جديد اليوم
      prisma.cV.count({
        where: {
          createdAt: { gte: todayStart }
        }
      }),
      
      // محدث اليوم (تم تحديثه بعد إنشائه)
      prisma.cV.count({
        where: {
          updatedAt: { gte: todayStart },
          createdAt: { lt: todayStart }
        }
      }),
      
      // جديد هذا الأسبوع
      prisma.cV.count({
        where: {
          createdAt: { gte: weekStart }
        }
      }),
      
      // محدث هذا الأسبوع
      prisma.cV.count({
        where: {
          updatedAt: { gte: weekStart },
          createdAt: { lt: weekStart }
        }
      }),
      
      // جديد هذا الشهر
      prisma.cV.count({
        where: {
          createdAt: { gte: monthStart }
        }
      }),
      
      // محدث هذا الشهر
      prisma.cV.count({
        where: {
          updatedAt: { gte: monthStart },
          createdAt: { lt: monthStart }
        }
      }),
      
      // توزيع الحالات
      prisma.cV.groupBy({
        by: ['status'],
        _count: true
      })
    ])

    // تنظيم توزيع الحالات
    const statusBreakdown = {
      available: 0,
      booked: 0,
      hired: 0,
      returned: 0,
      archived: 0
    }

    statusCounts.forEach(item => {
      switch(item.status) {
        case 'AVAILABLE':
        case 'NEW':
          statusBreakdown.available += item._count
          break
        case 'BOOKED':
          statusBreakdown.booked = item._count
          break
        case 'HIRED':
          statusBreakdown.hired = item._count
          break
        case 'RETURNED':
          statusBreakdown.returned = item._count
          break
        case 'ARCHIVED':
          statusBreakdown.archived = item._count
          break
      }
    })

    return NextResponse.json({
      totalCVs,
      newToday,
      updatedToday,
      newThisWeek,
      updatedThisWeek,
      newThisMonth,
      updatedThisMonth,
      statusBreakdown,
      lastUpdate: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching CV statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
