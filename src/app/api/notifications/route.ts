import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { validateAuthFromRequest } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateAuthFromRequest(request)
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { user } = authResult

    // التحقق من صلاحية المدير العام
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    const result = await NotificationService.getUserNotifications(
      user.id,
      page,
      limit
    )

    // تصفية حسب الفئة والنوع إذا تم تحديدهما
    let filteredNotifications = result.notifications

    if (category) {
      filteredNotifications = filteredNotifications.filter(n => n.category === category)
    }

    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type)
    }

    return NextResponse.json({
      ...result,
      notifications: filteredNotifications
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشعارات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await validateAuthFromRequest(request)
    
    if (!authResult.success) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { user } = authResult

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 })
    }

    const { action, notificationId } = await request.json()

    switch (action) {
      case 'markAsRead':
        if (!notificationId) {
          return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
        }
        await NotificationService.markAsRead(notificationId, user.id)
        return NextResponse.json({ success: true })

      case 'markAllAsRead':
        await NotificationService.markAllAsRead(user.id)
        return NextResponse.json({ success: true })

      case 'delete':
        if (!notificationId) {
          return NextResponse.json({ error: 'معرف الإشعار مطلوب' }, { status: 400 })
        }
        await NotificationService.deleteNotification(notificationId, user.id)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'إجراء غير صحيح' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error handling notification action:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}
