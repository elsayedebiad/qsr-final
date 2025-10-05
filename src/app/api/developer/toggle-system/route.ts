import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    // التحقق من التوكن
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    // التحقق من أن المستخدم هو المطور
    const user = await db.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || (user.email !== 'developer@system.local' && user.role !== 'DEVELOPER')) {
      return NextResponse.json({ error: 'غير مصرح - فقط المطور يمكنه الوصول' }, { status: 403 })
    }

    // الحصول على الحالة الجديدة
    const { isActive } = await request.json()

    // تحديث حالة النظام في جدول SystemSettings (وليس حساب المطور)
    const systemSetting = await db.systemSettings.upsert({
      where: { key: 'system_active' },
      update: { value: isActive.toString() },
      create: { 
        key: 'system_active', 
        value: isActive.toString() 
      }
    })

    return NextResponse.json({
      success: true,
      message: isActive ? 'تم تفعيل النظام' : 'تم تعطيل النظام',
      isActive: systemSetting.value === 'true'
    })

  } catch (error) {
    console.error('Error toggling system:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث حالة النظام' },
      { status: 500 }
    )
  }
}
