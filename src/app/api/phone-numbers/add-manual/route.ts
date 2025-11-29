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
        { success: false, message: 'ليس لديك صلاحية لإضافة أرقام يدوياً' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      phoneNumber,
      salesPageId,
      source,
      country,
      city,
      deviceType,
      notes,
      addTimer
    } = body

    // التحقق من البيانات المطلوبة
    if (!phoneNumber || !salesPageId) {
      return NextResponse.json(
        { success: false, message: 'رقم الهاتف وصفحة المبيعات مطلوبان' },
        { status: 400 }
      )
    }

    // التحقق من أن الرقم غير موجود مسبقاً
    const existingNumber = await db.phoneNumber.findFirst({
      where: {
        phoneNumber,
        salesPageId
      }
    })

    if (existingNumber) {
      return NextResponse.json(
        { success: false, message: 'هذا الرقم موجود بالفعل في نفس صفحة المبيعات' },
        { status: 400 }
      )
    }

    // إعداد بيانات الرقم
    let phoneData: any = {
      name: name || 'عميل بوب اب',
      phoneNumber,
      salesPageId,
      source: source || 'يدوي',
      country: country || null,
      city: city || null,
      deviceType: deviceType || null,
      notes: notes || null,
      ipAddress: 'إضافة يدوية',
      userAgent: 'إضافة يدوية من لوحة التحكم'
    }

    // إضافة مؤقت إذا كان مطلوباً
    if (addTimer) {
      const deadlineAt = new Date()
      deadlineAt.setHours(deadlineAt.getHours() + 6)
      phoneData.deadlineHours = 6
      phoneData.deadlineMinutes = 0
      phoneData.deadlineSeconds = 0
      phoneData.deadlineAt = deadlineAt
      phoneData.isExpired = false
    }

    // حفظ الرقم
    const phoneNumberRecord = await db.phoneNumber.create({
      data: phoneData
    })

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الرقم بنجاح',
      phoneNumber: phoneNumberRecord
    })

  } catch (error) {
    console.error('Error adding manual phone number:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء إضافة الرقم' },
      { status: 500 }
    )
  }
}
