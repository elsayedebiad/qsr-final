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
        // إصلاح مشكلة الفلتر اليومي - استخدام نسخ منفصلة من التاريخ
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
        dateFilter = {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
        console.log('Daily filter range:', { startOfDay, endOfDay })
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

    console.log('Using date filter:', dateFilter)
    
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
    
    console.log(`Found ${uploadedCVs.length} uploaded CVs with current filter`)
    
    // إذا لم نجد بيانات في الفترة المحددة، نجلب آخر 100 سيرة ذاتية
    let fallbackCVs: any[] = []
    if (uploadedCVs.length === 0 && filterType === 'daily') {
      console.log('No CVs found for today, fetching recent CVs as fallback...')
      fallbackCVs = await prisma.cV.findMany({
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
        },
        take: 100
      })
      console.log(`Found ${fallbackCVs.length} recent CVs as fallback`)
    }

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
      where: uploadedCVs.length > 0 ? dateFilter : {}, // استخدام جميع البيانات إذا لم توجد بيانات في الفترة المحددة
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

    // إحصائيات حسب الحالة - عرض البيانات حتى لو لم توجد بيانات حديثة
    const statusStats = await prisma.cV.groupBy({
      by: ['status'],
      where: uploadedCVs.length > 0 ? dateFilter : {},
      _count: {
        id: true
      }
    })

    // إحصائيات حسب الأولوية - عرض البيانات حتى لو لم توجد بيانات حديثة
    const priorityStats = await prisma.cV.groupBy({
      by: ['priority'],
      where: uploadedCVs.length > 0 ? dateFilter : {},
      _count: {
        id: true
      }
    })

    // إحصائيات حسب الجنسية (فلترة البيانات الفارغة من النتائج)
    let nationalityStats: any[] = []
    try {
      const rawNationalityStats = await prisma.cV.groupBy({
        by: ['nationality'],
        where: uploadedCVs.length > 0 ? dateFilter : {}, // عرض جميع البيانات إذا لم توجد بيانات حديثة
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

    // استخدام البيانات الاحتياطية إذا لم توجد بيانات في الفترة المحددة
    const finalUploadedCVs = uploadedCVs.length > 0 ? uploadedCVs : fallbackCVs
    const isUsingFallback = uploadedCVs.length === 0 && fallbackCVs.length > 0

    return NextResponse.json({
      summary: {
        totalUploaded: finalUploadedCVs.length,
        totalUpdated: updatedCVs.length,
        filterType,
        startDate: dateFilter.createdAt?.gte || null,
        endDate: dateFilter.createdAt?.lte || null,
        isUsingFallback,
        fallbackMessage: isUsingFallback ? 'لا توجد بيانات لليوم الحالي، يتم عرض آخر البيانات المتاحة' : null
      },
      uploadedCVs: finalUploadedCVs.map(cv => ({
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
        createdAt: cv.createdAt,
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

