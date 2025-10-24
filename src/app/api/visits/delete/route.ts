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
    const { visitIds } = body

    if (!visitIds || !Array.isArray(visitIds) || visitIds.length === 0) {
      return NextResponse.json(
        { error: 'يرجى تحديد زيارات للحذف' },
        { status: 400 }
      )
    }

    // حذف الزيارات المحددة نهائياً من قاعدة البيانات
    const result = await db.visit.deleteMany({
      where: {
        id: {
          in: visitIds
        }
      }
    })

    // تسجيل في Activity Log
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_VISITS',
          entityId: visitIds.join(','),
          details: `Deleted ${result.count} visits permanently`,
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
