/**
 * API endpoint لتسجيل خروج من الصفحات
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { logActivity } from '@/lib/activity-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // استثناء DEVELOPER من التسجيل
    if (user.role === 'DEVELOPER') {
      return NextResponse.json({
        success: true,
        message: 'Logging disabled for DEVELOPER'
      })
    }

    const body = await request.json()
    const { pagePath, duration } = body

    // الحصول على IP و User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await logActivity({
      userId: user.id,
      userRole: user.role,
      action: 'PAGE_EXIT',
      description: `خروج من صفحة: ${pagePath} (مدة البقاء: ${duration} ثانية)`,
      targetType: 'SYSTEM',
      metadata: { pagePath, duration },
      ipAddress,
      userAgent
    })

    return NextResponse.json({
      success: true,
      message: 'تم تسجيل خروج من الصفحة'
    })
  } catch (error) {
    console.error('Error logging page exit:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    )
  }
}
