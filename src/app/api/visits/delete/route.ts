import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح - يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    // التحقق من أن المستخدم ADMIN أو DEVELOPER فقط
    const allowedRoles = ['ADMIN', 'DEVELOPER']
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'غير مصرح - الحذف للمدير والمطور فقط' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { visitIds, deleteAll, filters } = body

    let result

    if (deleteAll && filters) {
      // حذف جماعي حسب الفلاتر
      const where: any = { isArchived: false }
      
      if (filters.country) {
        where.country = filters.country
      }
      
      if (filters.targetPage) {
        where.targetPage = filters.targetPage
      }
      
      if (filters.dateFrom) {
        where.timestamp = {
          ...where.timestamp,
          gte: new Date(filters.dateFrom)
        }
      }
      
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.timestamp = {
          ...where.timestamp,
          lte: endDate
        }
      }

      result = await db.visit.deleteMany({ where })
    } else if (visitIds && Array.isArray(visitIds) && visitIds.length > 0) {
      // حذف زيارات محددة بالـ IDs
      result = await db.visit.deleteMany({
        where: {
          id: {
            in: visitIds
          }
        }
      })
    } else {
      return NextResponse.json(
        { error: 'يرجى تحديد زيارات للحذف' },
        { status: 400 }
      )
    }

    // تسجيل في Activity Log
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_VISITS',
          entityId: visitIds ? visitIds.join(',') : 'bulk_delete',
          details: deleteAll 
            ? `Deleted ${result.count} visits permanently (bulk delete with filters)` 
            : `Deleted ${result.count} visits permanently`,
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'Unknown'
        }
      })
    } catch (logError) {
      console.error('Failed to log activity:', logError)
    }

    return NextResponse.json({
      success: true,
      message: `تم حذف ${result.count} زيارة بنجاح`,
      deletedCount: result.count
    })
  } catch (error) {
    console.error('Error deleting visits:', error)
    return NextResponse.json(
      { error: 'فشل حذف الزيارات' },
      { status: 500 }
    )
  }
}
