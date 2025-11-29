import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // التحقق من صلاحيات المستخدم
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح' },
        { status: 401 }
      )
    }

    // يجب أن يكون المستخدم أدمن
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'ليس لديك صلاحية لسحب الأرقام' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'معرف الرقم مطلوب' },
        { status: 400 }
      )
    }

    // التحقق من وجود الرقم
    const phoneNumber = await db.phoneNumber.findUnique({
      where: { id: parseInt(id) }
    })

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'الرقم غير موجود' },
        { status: 404 }
      )
    }

    // سحب الرقم - جعله منتهي بدون تحويل
    const now = new Date()
    
    let updateData: any = {
      isExpired: true,
      expiredAt: now,
      // حذف المؤقت
      deadlineAt: null,
      deadlineHours: null,
      deadlineMinutes: null,
      deadlineSeconds: null,
      // لا نحول الرقم - نتركه مسحوب فقط
      // isTransferred يبقى false حتى يظهر في فلتر المسحوبة
    }
    
    await db.phoneNumber.update({
      where: { id: parseInt(id) },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'تم سحب الرقم بنجاح'
    })

  } catch (error) {
    console.error('Error withdrawing phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء سحب الرقم' },
      { status: 500 }
    )
  }
}
