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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const targetPage = searchParams.get('targetPage') || undefined
    const country = searchParams.get('country') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const skip = (page - 1) * limit

    // بناء الشروط
    const where: any = {}
    
    if (targetPage) {
      where.targetPage = targetPage
    }
    
    if (country) {
      where.country = country
    }
    
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) {
        where.timestamp.gte = new Date(startDate)
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate)
      }
    }

    // جلب الزيارات
    const [visits, total] = await Promise.all([
      db.visit.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      db.visit.count({ where })
    ])

    // إحصائيات عامة
    const stats = await db.visit.groupBy({
      by: ['country'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    // إحصائيات الصفحات
    const pageStats = await db.visit.groupBy({
      by: ['targetPage'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // عدد الزوار الفريدين (IPs فريدة)
    const uniqueVisitors = await db.visit.groupBy({
      by: ['ipAddress'],
      where,
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      success: true,
      visits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalVisits: total,
        uniqueVisitors: uniqueVisitors.length,
        countries: stats.map(s => ({
          country: s.country || 'Unknown',
          count: s._count.id
        })),
        pages: pageStats.map(p => ({
          page: p.targetPage,
          count: p._count.id
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visits' },
      { status: 500 }
    )
  }
}
