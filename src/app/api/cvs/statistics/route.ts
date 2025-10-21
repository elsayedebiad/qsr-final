import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    /*
    ملاحظة مهمة: تم توحيد منطق حساب الإحصائيات مع API إحصائيات الرفع (/api/upload-statistics)
    
    المنطق الموحد:
    1. "جديد اليوم": السير المنشأة اليوم (من 00:00:00 إلى 23:59:59)
    2. "محدث اليوم": من السير المنشأة اليوم، التي updatedAt أكبر من createdAt بأكثر من ثانية
    
    هذا يضمن تطابق الأرقام بين البطاقة العلوية والقسم السفلي في صفحة الإحصائيات
    */
    
    // التحقق من التوكن
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = await AuthService.verifyToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // حساب التواريخ - نفس منطق upload-statistics بالضبط
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    // نفس منطق upload-statistics للأسبوع والشهر
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)
    
    const monthStart = new Date(now)
    monthStart.setDate(now.getDate() - 30)
    monthStart.setHours(0, 0, 0, 0)
    
    console.log('Date filters:', { todayStart, todayEnd, weekStart, monthStart })

    // جلب الإحصائيات بطريقة منفصلة لضمان الدقة
    const totalCVs = await prisma.cV.count()
    
    const newToday = await prisma.cV.count({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })
    
    // محدث اليوم - نفس منطق upload-statistics بالضبط
    // نجلب جميع السير التي تم إنشاؤها اليوم (نفس dateFilter في upload-statistics)
    const allCVsToday = await prisma.cV.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    })
    
    // فلترة السير المحدثة فقط - نفس منطق upload-statistics بالضبط
    const updatedToday = allCVsToday.filter(cv => {
      const created = new Date(cv.createdAt).getTime()
      const updated = new Date(cv.updatedAt).getTime()
      return updated > created + 1000 // فرق أكثر من ثانية واحدة
    }).length
    
    const newThisWeek = await prisma.cV.count({
      where: {
        createdAt: { gte: weekStart }
      }
    })
    
    // محدث هذا الأسبوع - نفس منطق upload-statistics بالضبط
    const allCVsThisWeek = await prisma.cV.findMany({
      where: {
        createdAt: { gte: weekStart }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    })
    const updatedThisWeek = allCVsThisWeek.filter(cv => {
      const created = new Date(cv.createdAt).getTime()
      const updated = new Date(cv.updatedAt).getTime()
      return updated > created + 1000 // فرق أكثر من ثانية واحدة
    }).length
    
    const newThisMonth = await prisma.cV.count({
      where: {
        createdAt: { gte: monthStart }
      }
    })
    
    // محدث هذا الشهر - نفس منطق upload-statistics بالضبط
    const allCVsThisMonth = await prisma.cV.findMany({
      where: {
        createdAt: { gte: monthStart }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    })
    const updatedThisMonth = allCVsThisMonth.filter(cv => {
      const created = new Date(cv.createdAt).getTime()
      const updated = new Date(cv.updatedAt).getTime()
      return updated > created + 1000 // فرق أكثر من ثانية واحدة
    }).length
    
    const statusCounts = await prisma.cV.groupBy({
      by: ['status'],
      _count: true
    })

    console.log('=== CV Statistics API ===')
    console.log('Date filters used:', { todayStart, todayEnd, weekStart, monthStart })
    console.log('Statistics calculated:', {
      totalCVs,
      newToday,
      updatedToday,
      newThisWeek,
      updatedThisWeek,
      newThisMonth,
      updatedThisMonth
    })
    console.log('Raw data counts:', {
      allCVsTodayCount: allCVsToday.length,
      allCVsThisWeekCount: allCVsThisWeek.length,
      allCVsThisMonthCount: allCVsThisMonth.length
    })

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
