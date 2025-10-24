import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

// POST: أرشفة الزيارات (نقلها للأرشيف)
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { visitIds, archiveAll, filters } = body

    let archivedCount = 0

    if (archiveAll) {
      // أرشفة جميع الزيارات حسب الفلاتر
      const whereClause: {
        isArchived: boolean
        country?: string
        targetPage?: string
        timestamp?: {
          gte?: Date
          lte?: Date
        }
      } = {
        isArchived: false
      }

      if (filters?.country && filters.country !== 'ALL') {
        whereClause.country = filters.country
      }

      if (filters?.targetPage && filters.targetPage !== 'ALL') {
        whereClause.targetPage = filters.targetPage
      }

      if (filters?.dateFrom) {
        whereClause.timestamp = {
          ...whereClause.timestamp,
          gte: new Date(filters.dateFrom)
        }
      }

      if (filters?.dateTo) {
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999)
        whereClause.timestamp = {
          ...whereClause.timestamp,
          lte: toDate
        }
      }

      const result = await db.visit.updateMany({
        where: whereClause,
        data: {
          isArchived: true,
          archivedAt: new Date()
        }
      })

      archivedCount = result.count
    } else if (visitIds && Array.isArray(visitIds)) {
      // أرشفة زيارات محددة
      const result = await db.visit.updateMany({
        where: {
          id: { in: visitIds },
          isArchived: false
        },
        data: {
          isArchived: true,
          archivedAt: new Date()
        }
      })

      archivedCount = result.count
    } else {
      return NextResponse.json(
        { error: 'يجب تحديد الزيارات المراد أرشفتها' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `تم أرشفة ${archivedCount} زيارة`,
      archivedCount
    })
  } catch (error) {
    console.error('Error archiving visits:', error)
    return NextResponse.json(
      { error: 'Failed to archive visits' },
      { status: 500 }
    )
  }
}

// GET: جلب الزيارات المؤرشفة
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    const allowedRoles = ['ADMIN', 'DEVELOPER']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'غير مصرح - هذه الصفحة للمدير والمطور فقط' },
        { status: 403 }
      )
    }

    // جلب query parameters للفلترة
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const targetPage = searchParams.get('targetPage')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: {
      isArchived: boolean
      country?: string
      targetPage?: string
      timestamp?: {
        gte?: Date
        lte?: Date
      }
    } = {
      isArchived: true
    }

    if (country && country !== 'ALL') {
      whereClause.country = country
    }

    if (targetPage && targetPage !== 'ALL') {
      whereClause.targetPage = targetPage
    }

    if (dateFrom) {
      whereClause.timestamp = {
        ...whereClause.timestamp,
        gte: new Date(dateFrom)
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      whereClause.timestamp = {
        ...whereClause.timestamp,
        lte: toDate
      }
    }

    // حساب الإجمالي
    const total = await db.visit.count({ where: whereClause })

    // جلب الزيارات المؤرشفة - الترتيب حسب ID (الأحدث = ID الأكبر)
    const visits = await db.visit.findMany({
      where: whereClause,
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // جلب إحصائيات
    const allArchivedVisits = await db.visit.findMany({
      where: { isArchived: true },
      select: {
        country: true,
        targetPage: true,
        timestamp: true,
        isGoogle: true
      }
    })

    const totalArchived = allArchivedVisits.length
    const uniqueCountries = Array.from(new Set(allArchivedVisits.map(v => v.country).filter(Boolean)))
    const uniquePages = Array.from(new Set(allArchivedVisits.map(v => v.targetPage)))

    return NextResponse.json({
      success: true,
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalArchived,
        uniqueCountries: uniqueCountries.length,
        uniquePages: uniquePages.length
      }
    })
  } catch (error) {
    console.error('Error fetching archived visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archived visits' },
      { status: 500 }
    )
  }
}

// PUT: إلغاء الأرشفة (استعادة الزيارات)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    const allowedRoles = ['ADMIN', 'DEVELOPER']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'غير مصرح - هذه الصفحة للمدير والمطور فقط' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { visitIds } = body

    let restoredCount = 0

    if (visitIds && Array.isArray(visitIds)) {
      // استعادة زيارات محددة
      const result = await db.visit.updateMany({
        where: {
          id: { in: visitIds },
          isArchived: true
        },
        data: {
          isArchived: false,
          archivedAt: null
        }
      })

      restoredCount = result.count
    } else {
      return NextResponse.json(
        { error: 'يجب تحديد الزيارات المراد استعادتها' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `تم استعادة ${restoredCount} زيارة`,
      restoredCount
    })
  } catch (error) {
    console.error('Error restoring visits:', error)
    return NextResponse.json(
      { error: 'Failed to restore visits' },
      { status: 500 }
    )
  }
}

// DELETE: حذف الزيارات المؤرشفة نهائياً
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    // فقط DEVELOPER يمكنه الحذف النهائي
    if (user.role !== 'DEVELOPER') {
      return NextResponse.json(
        { error: 'غير مصرح - هذه العملية للمطور فقط' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { visitIds, deleteAll } = body

    let deletedCount = 0

    if (deleteAll) {
      // حذف جميع الزيارات المؤرشفة
      const result = await db.visit.deleteMany({
        where: { isArchived: true }
      })
      deletedCount = result.count
    } else if (visitIds && Array.isArray(visitIds)) {
      // حذف زيارات محددة
      const result = await db.visit.deleteMany({
        where: {
          id: { in: visitIds },
          isArchived: true
        }
      })
      deletedCount = result.count
    } else {
      return NextResponse.json(
        { error: 'يجب تحديد الزيارات المراد حذفها' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف ${deletedCount} زيارة نهائياً`,
      deletedCount
    })
  } catch (error) {
    console.error('Error deleting archived visits:', error)
    return NextResponse.json(
      { error: 'Failed to delete visits' },
      { status: 500 }
    )
  }
}
