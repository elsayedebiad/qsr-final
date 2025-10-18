import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { validateAuthFromRequest } from '../../../lib/middleware-auth'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await validateAuthFromRequest(req)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }

    // التحقق من الصلاحيات (ADMIN فقط)
    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول - صلاحيات المدير فقط' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const filterType = searchParams.get('filterType') || 'daily' // daily, weekly, monthly, custom
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter: any = {}
    const now = new Date()

    // تحديد نطاق التاريخ حسب نوع الفلتر
    switch (filterType) {
      case 'daily':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0))
        const endOfDay = new Date(now.setHours(23, 59, 59, 999))
        dateFilter = {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
        break
      
      case 'weekly':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - 7)
        startOfWeek.setHours(0, 0, 0, 0)
        dateFilter = {
          createdAt: {
            gte: startOfWeek
          }
        }
        break
      
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = {
          createdAt: {
            gte: startOfMonth
          }
        }
        break
      
      case 'custom':
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          }
        }
        break
    }

    // جلب إحصائيات السير الذاتية المرفوعة
    const uploadedCVs = await prisma.cV.findMany({
      where: dateFilter,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // جلب إحصائيات السير الذاتية المحدثة (السير التي updatedAt مختلف عن createdAt)
    const allCVs = await prisma.cV.findMany({
      where: dateFilter,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // فلترة السير المحدثة فقط
    const updatedCVs = allCVs.filter(cv => {
      const created = new Date(cv.createdAt).getTime()
      const updated = new Date(cv.updatedAt).getTime()
      return updated > created + 1000 // فرق أكثر من ثانية واحدة
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    // إحصائيات حسب المستخدم
    const userStats = await prisma.cV.groupBy({
      by: ['createdById'],
      where: dateFilter,
      _count: {
        id: true
      }
    })

    // جلب أسماء المستخدمين
    const userIds = userStats.map(stat => stat.createdById)

    const usersData = userIds.length > 0 ? await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    }) : []

    const userStatsWithNames = userStats
      .map(stat => {
        const user = usersData.find(u => u.id === stat.createdById)
        return {
          userId: stat.createdById.toString(),
          userName: user?.name || 'غير معروف',
          userEmail: user?.email || '',
          userRole: user?.role || '',
          count: stat._count.id
        }
      })
      .sort((a, b) => b.count - a.count)

    // إحصائيات حسب الحالة
    const statusStats = uploadedCVs.length > 0 ? await prisma.cV.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        id: true
      }
    }) : []

    // إحصائيات حسب الأولوية
    const priorityStats = uploadedCVs.length > 0 ? await prisma.cV.groupBy({
      by: ['priority'],
      where: dateFilter,
      _count: {
        id: true
      }
    }) : []

    // إحصائيات حسب الجنسية (فلترة البيانات الفارغة من النتائج)
    let nationalityStats: any[] = []
    if (uploadedCVs.length > 0) {
      try {
        const rawNationalityStats = await prisma.cV.groupBy({
          by: ['nationality'],
          where: dateFilter,
          _count: {
            id: true
          }
        })
        // فلترة القيم الفارغة أو null
        nationalityStats = rawNationalityStats.filter(stat => 
          stat.nationality && stat.nationality.trim() !== ''
        )
      } catch (error) {
        console.error('Error grouping by nationality:', error)
        nationalityStats = []
      }
    }

    // إحصائيات يومية للرسم البياني (آخر 30 يوم)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const allCVsLast30Days = await prisma.cV.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true
      }
    })

    // تجميع البيانات حسب اليوم
    const last30Days = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const count = allCVsLast30Days.filter(cv => {
        const cvDate = new Date(cv.createdAt)
        return cvDate >= date && cvDate < nextDate
      }).length
      
      last30Days.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }

    return NextResponse.json({
      summary: {
        totalUploaded: uploadedCVs.length,
        totalUpdated: updatedCVs.length,
        filterType,
        startDate: dateFilter.createdAt?.gte || null,
        endDate: dateFilter.createdAt?.lte || null
      },
      uploadedCVs: uploadedCVs.map(cv => ({
        id: cv.id,
        fullName: cv.fullName,
        fullNameArabic: cv.fullNameArabic,
        referenceCode: cv.referenceCode,
        nationality: cv.nationality,
        status: cv.status,
        priority: cv.priority,
        createdAt: cv.createdAt,
        createdBy: cv.createdBy
      })),
      updatedCVs: updatedCVs.map(cv => ({
        id: cv.id,
        fullName: cv.fullName,
        fullNameArabic: cv.fullNameArabic,
        referenceCode: cv.referenceCode,
        nationality: cv.nationality,
        status: cv.status,
        priority: cv.priority,
        updatedAt: cv.updatedAt,
        createdBy: cv.createdBy
      })),
      userStats: userStatsWithNames,
      statusStats: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id
      })),
      priorityStats: priorityStats.map(stat => ({
        priority: stat.priority,
        count: stat._count.id
      })),
      nationalityStats: nationalityStats.map(stat => ({
        nationality: stat.nationality || 'غير محدد',
        count: stat._count.id
      })).sort((a, b) => b.count - a.count).slice(0, 10), // أعلى 10 جنسيات
      chartData: last30Days
    })

  } catch (error: any) {
    console.error('Error fetching upload statistics:', error)
    return NextResponse.json(
      { 
        error: 'حدث خطأ في جلب الإحصائيات',
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

